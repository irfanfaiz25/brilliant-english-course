import { notFound } from "next/navigation";

/**
 * Any admin path no module claims (`/admin/tidak-ada`) gets the admin 404 inside the shell, for
 * signed-in staff; the proxy sends visitors without a session to sign in first.
 */
export default function UnknownAdminPage() {
  notFound();
}
