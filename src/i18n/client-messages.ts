import type { Messages } from "next-intl";

/**
 * Message namespaces sent to the browser. Server Components read every namespace on the server;
 * only namespaces used by Client Components belong here, to keep the client payload small.
 */
export const clientNamespaces = [
  "LocaleSwitcher",
  "UI",
  "PartnerForm",
  "ContactForm",
] as const satisfies readonly (keyof Messages)[];

/** Namespaces for the admin area's root layout; never sent with public pages. */
export const adminClientNamespaces = ["UI", "Auth"] as const satisfies readonly (keyof Messages)[];

export function pickClientMessages(
  messages: Messages,
  namespaces: readonly (keyof Messages)[] = clientNamespaces,
): Partial<Messages> {
  return Object.fromEntries(namespaces.map((namespace) => [namespace, messages[namespace]]));
}
