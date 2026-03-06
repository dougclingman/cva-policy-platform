"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AnnouncementFormProps {
  announcement?: {
    id: string;
    title: string;
    body: string;
    priority: string;
    expiresAt?: Date | string | null;
    status: string;
  };
}

const PRIORITIES = [
  { value: "INFO",     label: "Info" },
  { value: "WARNING",  label: "Warning" },
  { value: "CRITICAL", label: "Critical" },
];

export function AnnouncementForm({ announcement }: AnnouncementFormProps) {
  const router = useRouter();
  const isEdit = !!announcement?.id;

  const [title,     setTitle]     = useState(announcement?.title ?? "");
  const [priority,  setPriority]  = useState(announcement?.priority ?? "INFO");
  const [body,      setBody]      = useState(announcement?.body ?? "");
  const [expiresAt, setExpiresAt] = useState(() => {
    if (!announcement?.expiresAt) return "";
    return new Date(announcement.expiresAt).toISOString().slice(0, 10);
  });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required."); return; }
    if (!body.trim())  { setError("Body is required."); return; }

    setLoading(true);
    try {
      const url    = isEdit ? `/api/announcements/${announcement!.id}` : "/api/announcements";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:     title.trim(),
          body:      body.trim(),
          priority,
          expiresAt: expiresAt || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save announcement");
      }

      router.push("/announcements");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Scheduled maintenance window this weekend"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="priority">
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="body">
          Body <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">Markdown supported</span>
        </label>
        <textarea
          id="body"
          required
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the announcement content here. Markdown is supported."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y font-mono"
        />
      </div>

      {/* Expires At */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="expiresAt">
          Expires At
          <span className="ml-2 text-xs font-normal text-slate-400">Optional — leave blank for no expiry</span>
        </label>
        <input
          id="expiresAt"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Announcement"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
