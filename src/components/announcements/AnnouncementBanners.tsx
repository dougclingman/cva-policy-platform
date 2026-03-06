"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "INFO" | "WARNING" | "CRITICAL";
}

interface Props {
  announcements: Announcement[];
}

const priorityConfig = {
  CRITICAL: {
    bg:   "bg-red-50 border-red-200",
    text: "text-red-900",
    sub:  "text-red-700",
    icon: AlertTriangle,
    iconCls: "text-red-500",
    closeCls: "text-red-400 hover:text-red-600 hover:bg-red-100",
  },
  WARNING: {
    bg:   "bg-amber-50 border-amber-200",
    text: "text-amber-900",
    sub:  "text-amber-700",
    icon: AlertCircle,
    iconCls: "text-amber-500",
    closeCls: "text-amber-400 hover:text-amber-600 hover:bg-amber-100",
  },
  INFO: {
    bg:   "bg-blue-50 border-blue-200",
    text: "text-blue-900",
    sub:  "text-blue-700",
    icon: Info,
    iconCls: "text-blue-500",
    closeCls: "text-blue-400 hover:text-blue-600 hover:bg-blue-100",
  },
} as const;

export function AnnouncementBanners({ announcements }: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  async function dismiss(id: string) {
    setDismissed((prev) => new Set(Array.from(prev).concat(id)));
    try {
      await fetch(`/api/announcements/${id}/dismiss`, { method: "POST" });
      router.refresh();
    } catch {
      // silently fail — banner is already hidden client-side
    }
  }

  return (
    <div className="space-y-2">
      {visible.map((ann) => {
        const cfg = priorityConfig[ann.priority];
        const Icon = cfg.icon;
        return (
          <div
            key={ann.id}
            className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${cfg.bg}`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${cfg.iconCls}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${cfg.text}`}>{ann.title}</p>
              <p className={`text-sm mt-0.5 line-clamp-2 ${cfg.sub}`}>{ann.body}</p>
            </div>
            <button
              onClick={() => dismiss(ann.id)}
              className={`flex-shrink-0 rounded p-1 transition-colors ${cfg.closeCls}`}
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
