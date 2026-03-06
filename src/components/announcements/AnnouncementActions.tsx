"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Archive, Trash2, Loader2 } from "lucide-react";

interface Props {
  announcementId: string;
  status: string;
}

export function AnnouncementActions({ announcementId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function performAction(action: string) {
    setLoading(action);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/announcements/${announcementId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
        router.push("/announcements");
        return;
      }

      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      {status === "DRAFT" && (
        <button
          onClick={() => performAction("publish")}
          disabled={!!loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          Publish
        </button>
      )}

      {status === "PUBLISHED" && (
        <button
          onClick={() => performAction("archive")}
          disabled={!!loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "archive" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
          Archive
        </button>
      )}

      <button
        onClick={() => {
          if (confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
            performAction("delete");
          }
        }}
        disabled={!!loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete
      </button>
    </div>
  );
}
