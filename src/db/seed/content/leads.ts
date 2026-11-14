import type { LeadStatus, PartnerBackground, PartnerSpace } from "@/features/partners/schema";

type SampleLead = {
  fullName: string;
  whatsapp: string;
  email: string | null;
  background: PartnerBackground;
  space: PartnerSpace;
  motivation: string;
  villageCode: string;
  locale: "id" | "en";
  status: LeadStatus;
  /** How long ago the application came in. */
  daysAgo: number;
};

/** PLACEHOLDER partner applications for the admin overview. People and numbers are fictional. */
export const sampleLeads: SampleLead[] = [
  {
    fullName: "Ratna Kusumawati",
    whatsapp: "6281200000101",
    email: "ratna@contoh.id",
    background: "educator",
    space: "ready",
    motivation: "Saya guru TK dan ingin membuka kelas bahasa Inggris di rumah.",
    villageCode: "32.01.01.1008",
    locale: "id",
    status: "new",
    daysAgo: 1,
  },
  {
    fullName: "Yusuf Hidayat",
    whatsapp: "6281200000102",
    email: null,
    background: "entrepreneur",
    space: "preparing",
    motivation: "Mencari usaha pendidikan yang bisa dijalankan bersama istri.",
    villageCode: "36.03.18.2009",
    locale: "id",
    status: "contacted",
    daysAgo: 3,
  },
  {
    fullName: "Siti Aminah",
    whatsapp: "6281200000103",
    email: "siti.aminah@contoh.id",
    background: "parent",
    space: "ready",
    motivation: "Anak-anak di kompleks kami butuh tempat les yang dekat.",
    villageCode: "31.74.07.1006",
    locale: "id",
    status: "qualified",
    daysAgo: 6,
  },
  {
    fullName: "Daniel Pardede",
    whatsapp: "6281200000104",
    email: "daniel@contoh.id",
    background: "other",
    space: "notYet",
    motivation: "Interested in running a unit near my office.",
    villageCode: "32.76.06.1001",
    locale: "en",
    status: "new",
    daysAgo: 12,
  },
];
