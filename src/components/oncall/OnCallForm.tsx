"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface OnCallFormProps {
  users: { id: string; name: string }[];
  entry?: {
    id:            string;
    userId:        string;
    startDate:     string;
    endDate:       string;
    phoneOverride: string | null;
    notes:         string | null;
  };
}

export function OnCallForm({ users, entry }: OnCallFormProps) {
  const router  = useRouter();
  const isEdit  = !!entry;

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState({
    userId:        entry?.userId        ?? "",
    startDate:     entry?.startDate     ?? "",
    endDate:       entry?.endDate       ?? "",
    phoneOverride: entry?.phoneOverride ?? "",
    notes:         entry?.notes         ?? "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const url    = isEdit ? `/api/oncall/${entry!.id}` : "/api/oncall";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:        form.userId,
          startDate:     form.startDate,
          endDate:       form.endDate,
          phoneOverride: form.phoneOverride || null,
          notes:         form.notes         || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save on-call entry");
        return;
      }

      router.push("/oncall");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {/* Assignment */}
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            On-Call Assignment
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Who <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.userId}
                onChange={(e) => set("userId", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">Select a team member…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Details */}
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Optional Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Override
              </label>
              <input
                type="text"
                value={form.phoneOverride}
                onChange={(e) => set("phoneOverride", e.target.value)}
                placeholder="e.g. +1 (559) 555-0123"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Temporary phone number to reach this person during their on-call shift
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional context for this on-call period…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Entry"}
        </button>
      </div>
    </form>
  );
}
