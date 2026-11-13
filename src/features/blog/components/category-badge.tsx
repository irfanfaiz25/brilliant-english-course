import { Badge } from "@/components/ui/badge";

import type { PostCategory } from "../schema";

const VARIANT = {
  "tips-belajar": "primary",
  parenting: "kindy",
  kegiatan: "info",
  kemitraan: "partner",
} as const satisfies Record<PostCategory, string>;

/** Category label with a stable color per category (text always carries the meaning). */
export function CategoryBadge({
  category,
  label,
  className,
}: {
  category: PostCategory;
  label: string;
  className?: string;
}) {
  return (
    <Badge variant={VARIANT[category]} className={className}>
      {label}
    </Badge>
  );
}
