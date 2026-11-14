"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AdminNav, type AdminNavSection } from "./admin-nav";

type AdminMobileNavProps = {
  sections: readonly AdminNavSection[];
  labels: { open: string; title: string; description: string };
};

/** Admin navigation in a left sheet below `lg`. Choosing a module closes it. */
export function AdminMobileNav({ sections, labels }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <MenuIcon aria-hidden />
          <span className="sr-only">{labels.open}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto bg-surface">
        <SheetHeader>
          <SheetTitle>{labels.title}</SheetTitle>
          <SheetDescription className="sr-only">{labels.description}</SheetDescription>
        </SheetHeader>
        <AdminNav sections={sections} variant="sheet" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
