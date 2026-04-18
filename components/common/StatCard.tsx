import { cn } from "@/lib/utils";

export type StatCardAccent = "active" | "inactive" | "featured" | "default";

const ACCENT_CLASSES: Record<StatCardAccent, string> = {
  active: "text-green-600 dark:text-green-400",
  inactive: "text-red-600 dark:text-red-400",
  featured: "text-amber-600 dark:text-amber-400",
  default: "text-foreground",
};

interface StatCardProps {
  label: string;
  value: number;
  accent?: StatCardAccent;
  className?: string;
}

export default function StatCard({ label, value, accent = "default", className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className={cn("text-2xl font-bold tabular-nums", ACCENT_CLASSES[accent])}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}