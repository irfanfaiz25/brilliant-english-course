"use client";

import { ChevronDownIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/features/users/actions";

type AdminUserMenuProps = {
  name: string;
  email: string;
  roleLabel: string;
  labels: { menu: string; viewSite: string; signOut: string };
};

/** Initials for the avatar: "Rina Lestari" → "RL". */
function initials(name: string): string {
  const [first = "", second = ""] = name.trim().split(/\s+/);
  return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase();
}

/** Avatar button in the top bar: who is signed in, a link to the public site and sign out. */
export function AdminUserMenu({ name, email, roleLabel, labels }: AdminUserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 rounded-full px-1.5 sm:pr-3">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground"
          >
            {initials(name)}
          </span>
          <span className="hidden max-w-40 truncate text-label text-foreground sm:inline">
            {name}
          </span>
          <ChevronDownIcon aria-hidden className="hidden size-4 text-muted-foreground sm:block" />
          <span className="sr-only">{labels.menu}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-72 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="truncate text-label text-foreground">{name}</p>
          <p className="truncate text-body-sm text-muted-foreground">{email}</p>
          <Badge variant="primary" className="mt-1 self-start">
            {roleLabel}
          </Badge>
        </div>
        <Separator />
        <Link
          href="/"
          target="_blank"
          className="flex min-h-10 items-center gap-2 rounded-md px-2 text-label text-foreground hover:bg-muted"
        >
          <ExternalLinkIcon aria-hidden className="size-4 text-muted-foreground" />
          {labels.viewSite}
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-label text-destructive-strong hover:bg-destructive-soft"
          >
            <LogOutIcon aria-hidden className="size-4" />
            {labels.signOut}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
