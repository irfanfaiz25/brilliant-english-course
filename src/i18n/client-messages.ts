import type { Messages } from "next-intl";

/**
 * Message namespaces sent to the browser. Server Components read every namespace on the server;
 * only namespaces used by Client Components belong here, to keep the client payload small.
 */
export const clientNamespaces = [
  "LocaleSwitcher",
  "UI",
  "PartnerForm",
] as const satisfies readonly (keyof Messages)[];

export function pickClientMessages(messages: Messages): Partial<Messages> {
  return Object.fromEntries(clientNamespaces.map((namespace) => [namespace, messages[namespace]]));
}
