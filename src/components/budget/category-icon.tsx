import {
  Car,
  CircleEllipsis,
  Clapperboard,
  HeartPulse,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/lib/budget/model";

const ICONS: Record<CategoryId, LucideIcon> = {
  restaurants: UtensilsCrossed,
  bills: Receipt,
  entertainment: Clapperboard,
  shopping: ShoppingBag,
  transport: Car,
  health: HeartPulse,
  other: CircleEllipsis,
};

export function CategoryIcon({ id, className }: { id: CategoryId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
