// What kind of device and comfort settings the visitor has. These are
// functions rather than constants because the answers can change mid-visit
// (a tablet gets a keyboard, someone flips "reduce motion" on).

const media = (query) =>
  typeof window !== "undefined" && window.matchMedia(query).matches;

/** A phone or tablet with no mouse: show on-screen controls and tap hints. */
export const isTouch = () => media("(hover: none) and (pointer: coarse)");

/** The OS "reduce motion" setting: skip typewriters, bobbing, and scrolling. */
export const prefersReducedMotion = () =>
  media("(prefers-reduced-motion: reduce)");

const READABLE_FONT_KEY = "exp:readableFont";

/** Options menu: swap the pixel font for a plain one in the HTML UI. */
export function readableFont() {
  try {
    return localStorage.getItem(READABLE_FONT_KEY) === "true";
  } catch {
    return false;
  }
}

export function setReadableFont(on) {
  try {
    localStorage.setItem(READABLE_FONT_KEY, String(on));
  } catch {
    // Storage unavailable -- the setting just won't persist.
  }
  document.body.classList.toggle("readable-font", on);
}
