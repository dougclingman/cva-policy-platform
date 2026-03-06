"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProjectFormTeam {
  id: string;
  name: string;
}

interface ProjectFormUser {
  id: string;
  name: string;
  email: string;
}

interface ProjectFormProject {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  teamId?: string | null;
}

interface ProjectFormProps {
  project?: ProjectFormProject | null;
  teams: ProjectFormTeam[];
  users: ProjectFormUser[];
  onSuccess?: (id: string) => void;
}

const PROJECT_STATUSES = [
  { value: "PLANNING",  label: "Planning" },
  { value: "ACTIVE",    label: "Active" },
  { value: "ON_HOLD",   label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function toDateInputValue(date?: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function ProjectForm({ project, teams, users, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const isEdit = !!project?.id;

  const [title,       setTitle]       = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status,      setStatus]      = useState(project?.status ?? "PLANNING");
  const [startDate,   setStartDate]   = useState(() => toDateInputValue(project?.startDate));
  const [endDate,     setEndDate]     = useState(() => toDateInputValue(project?.endDate));
  const [teamId,      setTeamId]      = useState(project?.teamId ?? "");
  const [memberIds,   setMemberIds]   = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Filter users to the selected team
  const filteredUsers = teamId
    ? users.filter((u) => {
        // We pass all users but rely on team filter at the page level to filter team members
        // If no team filter available, show all
        return true;
      })
    : users;

  // When team changes, reset member selection
  useEffect(() => {
    setMemberIds([]);
  }, [teamId]);

  function toggleMember(userId: string) {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setLoading(true);
    try {
      const url    = isEdit ? `/api/projects/${project!.id}` : "/api/projects";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        title:       title.trim(),
        description: description.trim() || null,
        status,
        startDate:   startDate || null,
        endDate:     endDate || null,
        teamId:      teamId || null,
      };

      if (!isEdit) {
        payload.memberIds = memberIds;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save project");
      }

      const data = await res.json();
      const id = isEdit ? project!.id : data.id;

      if (onSuccess) {
        onSuccess(id);
      } else {
        router.push(`/projects/${id}`);
      }
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
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="proj-title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="proj-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Network Infrastructure Upgrade"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="proj-description">
          Description
        </label>
        <textarea
          id="proj-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the project scope and goals..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="proj-status">
          Status
        </label>
        <select
          id="proj-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="proj-start-date">
            Start Date
          </label>
          <input
            id="proj-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="proj-end-date">
            End Date
          </label>
          <input
            id="proj-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Team */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="proj-team">
          Team
          <span className="ml-2 text-xs font-normal text-slate-400">Optional</span>
        </label>
        <select
          id="proj-team"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          <option value="">— No team —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Members (create mode only) */}
      {!isEdit && filteredUsers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Members
            <span className="ml-2 text-xs font-normal text-slate-400">
              You will be added as Project Manager automatically
            </span>
          </label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 max-h-48 overflow-y-auto space-y-1.5">
            {filteredUsers.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-white cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={memberIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{u.name}</span>
                <span className="text-xs text-slate-400">{u.email}</span>
              </label>
            ))}
          </div>
          {memberIds.length > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              {memberIds.length} member{memberIds.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Project"}
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
