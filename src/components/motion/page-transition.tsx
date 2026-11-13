import { ViewTransition, type ReactNode } from "react";

/**
 * Cross-fades page content on client-side navigation (View Transitions API, DESIGN.md § 3.2).
 * Used once in the site template so every route participates; browsers without support simply
 * swap content. The keyframes live in `globals.css` (`.page-fade`).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      {children}
    </ViewTransition>
  );
}
