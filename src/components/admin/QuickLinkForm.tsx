"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

interface QuickLink {
  id:           string;
  title:        string;
  url:          string;
  description:  string | null;
  icon:         string | null;
  displayOrder: number;
  isActive:     boolean;
}

interface Props {
  link?:      QuickLink | null;
  onSuccess:  () => void;
  onCancel:   () => void;
}

export function QuickLinkForm({ link, onSuccess, onCancel }: Props) {
  const isEditing = Boolean(link);

  const [title,        setTitle]        = useState(link?.title        ?? "");
  const [url,          setUrl]          = useState(link?.url          ?? "");
  const [description,  setDescription]  = useState(link?.description  ?? "");
  const [icon,         setIcon]         = useState(link?.icon         ?? "");
  const [displayOrder, setDisplayOrder] = useState(link?.displayOrder ?? 0);
  const [isActive,     setIsActive]     = useState(link?.isActive     ?? true);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }

    setSaving(true);
    try {
      const endpoint = isEditing
        ? `/api/admin/quick-links/${link!.id}`
        : "/api/admin/quick-links";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:        title.trim(),
          url:          url.trim(),
          description:  description.trim() || null,
          icon:         icon.trim() || null,
          displayOrder: Number(displayOrder),
          isActive,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save quick link.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">
        {isEditing ? "Edit Quick Link" : "New Quick Link"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. GitHub Org"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/your-org"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this link"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Icon <span className="text-slate-400 font-normal">(optional, emoji or abbreviation)</span>
          </label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, 4))}
            placeholder="🔗 or GH"
            maxLength={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Display Order */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-xs text-slate-400 mt-1">Lower numbers appear first.</p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3 pt-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Active</span>
          </label>
          <p className="text-xs text-slate-400">Only active links are shown on the dashboard.</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={saving}>
          {isEditing ? "Save Changes" : "Create Quick Link"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
