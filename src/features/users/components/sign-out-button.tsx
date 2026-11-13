import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { signOut } from "../actions";

/** Plain form posting to the sign-out action: works without JavaScript. */
export function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="secondary" size="sm">
        <LogOutIcon aria-hidden />
        {label}
      </Button>
    </form>
  );
}
