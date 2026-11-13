/** Accounts the auth E2E specs sign in with; one set per Playwright project so runs don't collide. */
export const E2E_PASSWORD = "e2e-password-123";

export const e2eUsers = (project: string) => ({
  admin: { email: `e2e-admin-${project}@bec.test`, name: "E2E Admin", role: "super_admin" },
  editor: { email: `e2e-editor-${project}@bec.test`, name: "E2E Editor", role: "editor" },
  disabled: { email: `e2e-disabled-${project}@bec.test`, name: "E2E Disabled", role: "editor" },
});

export const e2eProjects = ["desktop", "mobile"] as const;
