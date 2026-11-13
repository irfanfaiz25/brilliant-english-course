/**
 * Reading progress bar driven purely by CSS (`animation-timeline: scroll()`), zero JS.
 * Hidden in browsers without scroll-driven animations and for reduced motion (see `globals.css`).
 */
export function ScrollProgress() {
  return <div aria-hidden className="scroll-progress" />;
}
