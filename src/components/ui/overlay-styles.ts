/** Shared overlay look so dialogs, sheets and menus enter/leave the same way (DESIGN.md § 3). */
export const overlayBackdropClass =
  "fixed inset-0 z-(--z-overlay) bg-overlay backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0";

export const floatingPanelClass =
  "z-(--z-overlay) rounded-lg border border-border/70 bg-popover text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2";

export const closeButtonClass =
  "absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground [&_svg]:size-5";
