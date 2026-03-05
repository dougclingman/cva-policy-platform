import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "draft" | "under_review" | "published" | "archived" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  default:      "bg-gray-100 text-gray-700",
  draft:        "bg-gray-100 text-gray-600",
  under_review: "bg-yellow-100 text-yellow-800",
  published:    "bg-green-100 text-green-800",
  archived:     "bg-red-100 text-red-700",
  success:      "bg-green-100 text-green-800",
  warning:      "bg-yellow-100 text-yellow-800",
  danger:       "bg-red-100 text-red-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function policyStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    DRAFT:        "draft",
    UNDER_REVIEW: "under_review",
    PUBLISHED:    "published",
    ARCHIVED:     "archived",
  };
  return map[status] ?? "default";
}

export function policyStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT:        "Draft",
    UNDER_REVIEW: "Under Review",
    PUBLISHED:    "Published",
    ARCHIVED:     "Archived",
  };
  return map[status] ?? status;
}
