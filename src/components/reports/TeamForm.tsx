"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
}

interface TeamFormProps {
  users: User[];
  team?: {
    id: string;
    name: string;
    description?: string | null;
    leadId: string;
    memberIds: string[];
    reportsEnabled?: boolean;
  };
}

export function TeamForm({ users, team }: TeamFormProps) {
  const router = useRouter();
  const isEdit = !!team;

  const [name,           setName]           = useState(team?.name           ?? "");
  const [description,    setDescription]    = useState(team?.description    ?? "");
  const [leadId,         setLeadId]         = useState(team?.leadId         ?? "");
  const [memberIds,      setMemberIds]      = useState<string[]>(team?.memberIds ?? []);
  const [reportsEnabled, setReportsEnabled] = useState(team?.reportsEnabled ?? true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  function toggleMember(userId: string) {
    // Lead is always a member; cannot be deselected here
    if (userId === leadId) return;
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function handleLeadChange(newLeadId: string) {
    setLeadId(newLeadId);
    // Auto-add new lead to members if not already there
    if (newLeadId && !memberIds.includes(newLeadId)) {
      setMemberIds((prev) => [...prev, newLeadId]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const url    = isEdit ? `/api/admin/teams/${team!.id}` : "/api/admin/teams";
      const method = isEdit ? "PUT" : "POST";

      // Always include lead
      const allMemberIds = Array.from(new Set([leadId, ...memberIds]));

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           name.trim(),
          description:    description.trim() || null,
          leadId,
          memberIds:      allMemberIds,
          reportsEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save team");
        return;
      }

      router.push("/admin/teams");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  const effectiveMembers = new Set([leadId, ...memberIds]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {/* Team Details */}
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Team Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Infrastructure Team"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the team's responsibilities…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Team Lead <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={leadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a team lead…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">
            Members
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            The team lead is always included as a member.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {users.map((u) => {
              const isLead    = u.id === leadId;
              const isChecked = effectiveMembers.has(u.id);
              return (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    isChecked
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${isLead ? "opacity-70 cursor-default" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleMember(u.id)}
                    disabled={isLead}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 flex-1">{u.name}</span>
                  {isLead && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
                      Lead
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {users.length === 0 && (
            <p className="text-sm text-slate-400 italic">No users available.</p>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Settings
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reportsEnabled}
              onChange={(e) => setReportsEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Reports Enabled</span>
              <p className="text-xs text-slate-400 mt-0.5">
                When enabled, members of this team are expected to submit weekly reports.
              </p>
            </div>
          </label>
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
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Team"}
        </button>
      </div>
    </form>
  );
}
