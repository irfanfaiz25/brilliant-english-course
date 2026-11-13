/** First focusable element on every page: jumps keyboard users past the header. */
export function SkipLink({ targetId, label }: { targetId: string; label: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="fixed top-3 left-3 z-(--z-toast) -translate-y-[200%] rounded-md bg-primary px-4 py-3 text-button text-primary-foreground shadow-lg transition-transform duration-(--duration-base) ease-out focus-visible:translate-y-0"
    >
      {label}
    </a>
  );
}
