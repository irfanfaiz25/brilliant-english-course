import {
  BookOpenIcon,
  BookSearchIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  DicesIcon,
  FileTextIcon,
  FlagIcon,
  FolderOpenIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HandshakeIcon,
  HouseIcon,
  LayersIcon,
  MapPinnedIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  MonitorSmartphoneIcon,
  PackageOpenIcon,
  PaletteIcon,
  PresentationIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersRoundIcon,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

import type { PartnershipIcon as IconName } from "../page-schema";

const icons: Record<IconName, ComponentType<LucideProps>> = {
  book: BookOpenIcon,
  layers: LayersIcon,
  palette: PaletteIcon,
  worksheet: FileTextIcon,
  chat: MessagesSquareIcon,
  coins: HandCoinsIcon,
  home: HouseIcon,
  map: MapPinnedIcon,
  graduation: GraduationCapIcon,
  monitor: MonitorSmartphoneIcon,
  users: UsersRoundIcon,
  clipboard: ClipboardListIcon,
  bookSearch: BookSearchIcon,
  dice: DicesIcon,
  flag: FlagIcon,
  sparkles: SparklesIcon,
  megaphone: MegaphoneIcon,
  shield: ShieldCheckIcon,
  presentation: PresentationIcon,
  package: PackageOpenIcon,
  handshake: HandshakeIcon,
  calendar: CalendarCheckIcon,
  rocket: RocketIcon,
  folder: FolderOpenIcon,
};

/** A Kemitraan page icon by name (ADR-041); always decorative, the item's title says what it is. */
export function PartnershipIcon({ name, ...props }: LucideProps & { name: IconName }) {
  const Icon = icons[name];
  return <Icon aria-hidden {...props} />;
}
