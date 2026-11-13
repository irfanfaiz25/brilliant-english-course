import {
  BookOpenIcon,
  CalendarHeartIcon,
  CircleHelpIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  MapPinnedIcon,
  MessageSquareQuoteIcon,
  NewspaperIcon,
  SearchCheckIcon,
  SettingsIcon,
  StoreIcon,
  UserPlusIcon,
  UsersIcon,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

import type { AdminIcon as AdminIconName } from "@/config/admin-navigation";

const icons: Record<AdminIconName, ComponentType<LucideProps>> = {
  overview: LayoutDashboardIcon,
  leads: UserPlusIcon,
  units: StoreIcon,
  quota: MapPinnedIcon,
  programs: BookOpenIcon,
  activities: CalendarHeartIcon,
  blog: NewspaperIcon,
  testimonials: MessageSquareQuoteIcon,
  faq: CircleHelpIcon,
  media: ImagesIcon,
  users: UsersIcon,
  settings: SettingsIcon,
  seo: SearchCheckIcon,
};

/** Decorative icon of an admin module (its label is always next to it or `sr-only`). */
export function AdminIcon({ name, ...props }: LucideProps & { name: AdminIconName }) {
  const Icon = icons[name];
  return <Icon aria-hidden {...props} />;
}
