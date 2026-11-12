"use client";

import { MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

const districts = [
  "Babakan Madang",
  "Bojonggede",
  "Caringin",
  "Cibinong",
  "Cileungsi",
  "Citeureup",
  "Gunung Putri",
  "Sukamaju",
  "Sukaraja",
].map((name) => ({ value: name.toLowerCase().replaceAll(" ", "-"), label: name }));

export function FormDemo() {
  const [district, setDistrict] = useState<string | null>(null);
  const [phone, setPhone] = useState("0812");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Field label="Nama lengkap" required description="Sesuai KTP.">
        {(control) => <Input {...control} autoComplete="name" placeholder="Rina Lestari" />}
      </Field>
      <Field
        label="Nomor WhatsApp"
        required
        error={phone.length < 10 ? "Nomor WhatsApp minimal 10 digit." : undefined}
      >
        {(control) => (
          <Input
            {...control}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        )}
      </Field>
      <Field label="Level (Select — short list)">
        {(control) => (
          <Select>
            <SelectTrigger {...control}>
              <SelectValue placeholder="Pilih level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kindy">Kindy · 4–6 tahun</SelectItem>
              <SelectItem value="intro">Intro · 7–9 tahun</SelectItem>
              <SelectItem value="secondary">Secondary · 10–15 tahun</SelectItem>
            </SelectContent>
          </Select>
        )}
      </Field>
      <Field label="Kecamatan (Combobox — long list)">
        {(control) => (
          <Combobox
            {...control}
            options={districts}
            value={district}
            onValueChange={setDistrict}
            placeholder="Pilih kecamatan"
            searchPlaceholder="Cari kecamatan…"
          />
        )}
      </Field>
      <Field label="Disabled" description="Pilih kabupaten dulu.">
        {(control) => <Input {...control} disabled placeholder="Pilih kecamatan" />}
      </Field>
      <Field label="Motivasi" className="md:col-span-2">
        {(control) => (
          <Textarea {...control} placeholder="Ceritakan alasanmu ingin membuka unit BEC…" />
        )}
      </Field>
    </div>
  );
}

export function OverlayDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lanjut chat admin?</DialogTitle>
            <DialogDescription>
              Data pendaftaranmu sudah tersimpan. Admin BEC akan membalas lewat WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Nanti saja</Button>
            </DialogClose>
            <Button variant="whatsapp">
              <MessageCircleIcon aria-hidden />
              Chat WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary">Open sheet (right)</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Mobile navigation lives here (Phase 2d).</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary">Open sheet (bottom)</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Filter unit</SheetTitle>
            <SheetDescription>Bottom sheets suit filters on phones.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button>Terapkan</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Button
        variant="secondary"
        onClick={() =>
          toast.success("Pendaftaran terkirim", { description: "Admin akan menghubungimu." })
        }
      >
        Toast success
      </Button>
      <Button variant="secondary" onClick={() => toast.error("Gagal mengirim, coba lagi.")}>
        Toast error
      </Button>
      <Button
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1500);
        }}
      >
        Loading state
      </Button>
    </div>
  );
}
