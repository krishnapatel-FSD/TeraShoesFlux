// The prototype's inline SVG sprite and a helper to use one of its symbols.

export type IconName =
  | "heart"
  | "bag"
  | "search"
  | "x"
  | "up"
  | "truck"
  | "return"
  | "leaf"
  | "loop";

export function Icon({ name }: { name: IconName }) {
  return (
    <svg>
      <use href={`#i-${name}`} />
    </svg>
  );
}

export function IconSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <symbol id="i-heart" viewBox="0 0 24 24">
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </symbol>
      <symbol id="i-bag" viewBox="0 0 24 24">
        <path
          d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8zM8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </symbol>
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle
          cx="11"
          cy="11"
          r="6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16 16l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </symbol>
      <symbol id="i-x" viewBox="0 0 24 24">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </symbol>
      <symbol id="i-up" viewBox="0 0 24 24">
        <path
          d="M12 19V5M5 12l7-7 7 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>
      <symbol id="i-truck" viewBox="0 0 24 24">
        <path
          d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle
          cx="6.5"
          cy="17"
          r="1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="17"
          cy="17"
          r="1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </symbol>
      <symbol id="i-return" viewBox="0 0 24 24">
        <path
          d="M4 10h11a5 5 0 0 1 0 10H8M4 10l4-4M4 10l4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>
      <symbol id="i-leaf" viewBox="0 0 24 24">
        <path
          d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>
      <symbol id="i-loop" viewBox="0 0 24 24">
        <path
          d="M7 7h9a4 4 0 0 1 4 4v1M17 17H8a4 4 0 0 1-4-4v-1M14 4l3 3-3 3M10 20l-3-3 3-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>
    </svg>
  );
}
