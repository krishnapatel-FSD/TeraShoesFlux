// The TeraShoes logo as used on the site: the prototype's markup (a rotating "T" badge and the
// wordmark, styled by `.logo` in the prototype stylesheet). The same logo as an SVG file, for emails,
// social images and the favicon, is public/brand/logo.svg (`pnpm brand:logo`).

export function Logo({ menuClose = false }: { menuClose?: boolean }) {
  return (
    <a
      className="logo"
      href="#top"
      data-scroll
      {...(menuClose
        ? { "data-menu-close": true }
        : { "aria-label": "TeraShoes home" })}
    >
      <i aria-hidden="true">T</i>TERASHOES
    </a>
  );
}
