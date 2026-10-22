// B8: the hero video fallback for devices without WebGL, recorded from the real 3D scene.
//
//   pnpm dev            # in another terminal (dev builds include the recorder hook)
//   pnpm assets:hero    # writes public/hero-fallback/
//
// For each orientation (landscape 1920×1080, portrait 1080×1920 in the phone layout) it steps the
// scene frame by frame on this machine's GPU, then encodes with ffmpeg (Plan B, gate GB-5):
//   hero-{o}.webm        10 s seamless loop of the default colourway, VP9 with transparency: sits
//                        between the two headline copies, like the 3D canvas
//   hero-{o}.mp4         the same loop on the hero background (H.264 has no transparency), for Safari
//   still-{id}-{o}.webp  one transparent still per colourway (reduced motion, other colourways)
//   pose-{tour0…tour3|pdp}-{id}-{o}.webp
//                        the shoe docked in the tour chapters and the product viewer
//   thumbs/{id}.webp     the colourway thumbnails the scene renders for swatches, cards and the bag
// Options: --base-url http://localhost:3000, --encode-only (re-encode the frames already recorded)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POSE, TOUR_CHAPTERS } from "../../src/three/scrollDock.ts";

const FPS = 30;
/** Recorded length: the loop is 10 s, plus 1 s that crossfades its end into its start. */
const SECONDS = 11;
const FADE = 1;
/** Recorded frames (≈ 0.5 GB): in the system temp folder, so cloud-synced project folders skip them. */
const OUT = join(tmpdir(), "terashoes-hero");
const PUB = "public/hero-fallback";
const ORIENTATIONS = [
  { name: "landscape", viewport: { width: 1920, height: 1080 }, scale: 1 },
  { name: "portrait", viewport: { width: 540, height: 960 }, scale: 2 },
] as const;

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const baseUrl = flag("--base-url") ?? "http://localhost:3000";
const encodeOnly = args.includes("--encode-only");

const tokens = JSON.parse(readFileSync("tokens/colourways.json", "utf8")) as {
  colourways: { id: string }[];
};
const ids = tokens.colourways.map((c) => c.id);
/** The site opens on the first colourway, so that one gets the moving loop. */
const loopId = ids[0]!;

/** ffmpeg from FFMPEG, the PATH, or winget's install folder (a new shell may not see the PATH yet). */
function findFfmpeg(): string {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return "ffmpeg";
  } catch {}
  const packages = join(
    process.env.LOCALAPPDATA ?? "",
    "Microsoft/WinGet/Packages",
  );
  if (existsSync(packages))
    for (const dir of readdirSync(packages).filter((d) =>
      d.startsWith("Gyan.FFmpeg"),
    ))
      for (const build of readdirSync(join(packages, dir))) {
        const exe = join(packages, dir, build, "bin/ffmpeg.exe");
        if (existsSync(exe)) return exe;
      }
  console.error(
    "ffmpeg not found. Install it (winget install Gyan.FFmpeg) or set FFMPEG.",
  );
  process.exit(1);
}
const ffmpegExe = findFfmpeg();
const ffmpeg = (...a: string[]) =>
  execFileSync(ffmpegExe, ["-hide_banner", "-loglevel", "error", "-y", ...a], {
    stdio: "inherit",
  });

const png = (dataUrl: string) =>
  Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");

/* ---------- Record ---------- */
async function record() {
  const reachable = await fetch(baseUrl).then(
    (r) => r.ok,
    () => false,
  );
  if (!reachable) {
    console.error(
      `No dev server at ${baseUrl}. Start it with \`pnpm dev\` first.`,
    );
    process.exit(1);
  }

  const browser = await chromium.launch({
    // The real GPU: frames are stepped by hand, but software WebGL renders the lighting differently.
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
  });
  try {
    for (const o of ORIENTATIONS) {
      const dir = join(OUT, o.name);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const context = await browser.newContext({
        viewport: o.viewport,
        deviceScaleFactor: o.scale,
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__heroRecorder = {};
      });
      await page.goto(baseUrl);
      await page.waitForFunction(() => window.__heroRecorder?.ready?.(), null, {
        timeout: 120_000,
      });
      await page.evaluate(() => document.fonts.ready);

      // The hero gradient alone, for the MP4 (which can't be transparent). Its drifting blobs stay
      // live on the page, over the video.
      // (A page screenshot clipped to the hero: Playwright won't shoot an element styled hidden.)
      const hero = (await page.locator("#hero").boundingBox())!;
      writeFileSync(
        join(dir, "background.png"),
        await page.screenshot({
          clip: hero,
          animations: "disabled",
          style:
            "body * { visibility: hidden !important; } .hero-bg { visibility: visible !important; } .hero-bg::before, .hero-bg::after { display: none !important; }",
        }),
      );

      await page.evaluate(() => window.__heroRecorder!.pause!());
      const total = FPS * SECONDS;
      for (let i = 0; i < total; i++) {
        const frame = await page.evaluate(
          (dt) => window.__heroRecorder!.frame!(dt),
          1 / FPS,
        );
        writeFileSync(
          join(dir, `frame-${String(i).padStart(4, "0")}.png`),
          png(frame),
        );
        if (i % FPS === 0)
          process.stdout.write(`\r${o.name}: ${i / FPS} s of ${SECONDS}`);
      }
      console.log(`\r${o.name}: ${total} frames recorded`);

      // A still per colourway, held at the loop's start time (dt 0) once the rim light settles.
      for (const id of ids) {
        await page.evaluate((c) => window.__heroRecorder!.select!(c), id);
        await page.waitForTimeout(150);
        let still = "";
        for (let i = 0; i < 90; i++)
          still = await page.evaluate(() => window.__heroRecorder!.frame!(0));
        writeFileSync(join(dir, `still-${id}.png`), png(still));
      }

      // The shoe docked in each tour chapter and in the product viewer (see POSE),
      // cropped to each anchor. Each anchor is scrolled into view first, and the scroll-driven
      // pose has time to settle before the exact pose is set.
      const scrollTo = (selector: string, centre: boolean) =>
        page.evaluate(
          ([sel, mid]) => {
            const r = document
              .querySelector(sel as string)!
              .getBoundingClientRect();
            const top =
              r.top + scrollY - (mid ? (innerHeight - r.height) / 2 : 0);
            window.scrollTo({ top, behavior: "instant" });
          },
          [selector, centre] as const,
        );
      const pose = (a: number, anchor: string) =>
        page.evaluate(
          ([pa, an]) =>
            window.__heroRecorder!.pose!(pa as number, an as string),
          [a, anchor] as const,
        );
      for (const id of ids) {
        await page.evaluate((c) => window.__heroRecorder!.select!(c), id);
        await scrollTo("#tour", false);
        await page.waitForTimeout(2500);
        for (let c = 0; c < TOUR_CHAPTERS; c++)
          writeFileSync(
            join(dir, `pose-tour${c}-${id}.png`),
            png(await pose(POSE.tourFirst + c, "#a-story")),
          );
        await scrollTo("#a-pdp", true);
        await page.waitForTimeout(2500);
        writeFileSync(
          join(dir, `pose-pdp-${id}.png`),
          png(await pose(POSE.viewer, "#a-pdp")),
        );
      }

      if (o.name === "landscape") {
        const thumbs = await page.evaluate(() =>
          window.__heroRecorder!.thumbs!(),
        );
        mkdirSync(join(dir, "thumbs"), { recursive: true });
        for (const [id, url] of Object.entries(thumbs))
          writeFileSync(join(dir, "thumbs", `${id}.png`), png(url));
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
if (!encodeOnly) await record();

/* ---------- Encode ---------- */
mkdirSync(join(PUB, "thumbs"), { recursive: true });
// The loop: the last FADE seconds crossfade into the first, then the clip starts after them, so the
// end of the video leads straight back into its start.
const loopFilter = (input: string) =>
  `[${input}]format=yuva420p,split[a][b];` +
  `[a]trim=end_frame=${FADE * FPS},setpts=PTS-STARTPTS[head];` +
  `[b]trim=start_frame=${FADE * FPS},setpts=PTS-STARTPTS[body];` +
  `[body][head]xfade=transition=fade:duration=${FADE}:offset=${SECONDS - 2 * FADE}[loop]`;

for (const o of ORIENTATIONS) {
  const dir = join(OUT, o.name);
  const frames = join(dir, "frame-%04d.png");
  console.log(`Encoding ${o.name}…`);
  ffmpeg(
    "-framerate",
    String(FPS),
    "-i",
    frames,
    "-filter_complex",
    loopFilter("0"),
    "-map",
    "[loop]",
    "-c:v",
    "libvpx-vp9",
    "-pix_fmt",
    "yuva420p",
    "-crf",
    "38",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-deadline",
    "good",
    "-cpu-used",
    "2",
    "-auto-alt-ref",
    "0",
    "-an",
    join(PUB, `hero-${o.name}.webm`),
  );
  ffmpeg(
    "-framerate",
    String(FPS),
    "-i",
    frames,
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    join(dir, "background.png"),
    "-filter_complex",
    `${loopFilter("0")};[1]format=yuv420p[bg];[bg][loop]overlay=format=auto:shortest=0,format=yuv420p[v]`,
    "-map",
    "[v]",
    "-t",
    String(SECONDS - FADE),
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    join(PUB, `hero-${o.name}.mp4`),
  );
  // Stills and poses: still-{id}.png → still-{id}-{o}.webp, pose-tour0-{id}.png → pose-tour0-{id}-{o}.webp.
  for (const f of readdirSync(dir).filter((f) =>
    /^(still|pose)-.+\.png$/.test(f),
  ))
    ffmpeg(
      "-i",
      join(dir, f),
      "-c:v",
      "libwebp",
      "-quality",
      "82",
      "-pix_fmt",
      "yuva420p",
      join(PUB, f.replace(/\.png$/, `-${o.name}.webp`)),
    );
  if (o.name === "landscape")
    for (const id of ids)
      if (existsSync(join(dir, "thumbs", `${id}.png`)))
        ffmpeg(
          "-i",
          join(dir, "thumbs", `${id}.png`),
          "-c:v",
          "libwebp",
          "-quality",
          "88",
          "-pix_fmt",
          "yuva420p",
          join(PUB, "thumbs", `${id}.webp`),
        );
}

const kb = (f: string) => `${Math.round(statSync(f).size / 1024)} KB`;
for (const f of readdirSync(PUB).filter((f) => !f.startsWith("thumbs")))
  console.log(`  ${join(PUB, f)}  ${kb(join(PUB, f))}`);
console.log(
  `Loop colourway: ${loopId}. Frames kept in ${OUT} for --encode-only.`,
);
