"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, CheckSquare, Square } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

interface ProjectUpdate {
  projectId:    string;
  progressNote: string;
}

interface StaffReportFormProps {
  teams:    Team[];
  projects: Project[];
  report?: {
    id:             string;
    periodStart:    string;
    periodEnd:      string;
    accomplishments: string | null;
    priorities:     string | null;
    blockers:       string | null;
    teamId:         string | null;
    status?:        string;
    projectUpdates: ProjectUpdate[];
  };
  defaultPeriodStart?: string;
  defaultPeriodEnd?:   string;
}

const PROJECT_STATUS_OPTIONS = [
  { value: "ACTIVE",    label: "Active" },
  { value: "ON_HOLD",   label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
];

export function StaffReportForm({
  teams,
  projects: initialProjects,
  report,
  defaultPeriodStart = "",
  defaultPeriodEnd   = "",
}: StaffReportFormProps) {
  const router = useRouter();
  const isEdit = !!report;

  // Form fields
  const [periodStart,      setPeriodStart]      = useState(report?.periodStart?.slice(0, 10) ?? defaultPeriodStart);
  const [periodEnd,        setPeriodEnd]        = useState(report?.periodEnd?.slice(0, 10)   ?? defaultPeriodEnd);
  const [teamId,           setTeamId]           = useState(report?.teamId ?? "");
  const [accomplishments,  setAccomplishments]  = useState(report?.accomplishments ?? "");
  const [priorities,       setPriorities]       = useState(report?.priorities     ?? "");
  const [blockers,         setBlockers]         = useState(report?.blockers       ?? "");

  // Projects
  const [projects,         setProjects]         = useState<Project[]>(initialProjects);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(report?.projectUpdates?.map((pu) => pu.projectId) ?? [])
  );
  const [progressNotes,    setProgressNotes]    = useState<Record<string, string>>(
    Object.fromEntries(report?.projectUpdates?.map((pu) => [pu.projectId, pu.progressNote]) ?? [])
  );
  const [projectStatuses,  setProjectStatuses]  = useState<Record<string, string>>(
    Object.fromEntries(projects.map((p) => [p.id, p.status]))
  );

  // Add new project inline
  const [newProjectTitle,  setNewProjectTitle]  = useState("");
  const [addingProject,    setAddingProject]    = useState(false);

  // Submit state
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const isSubmitted = report?.status === "SUBMITTED";

  function toggleProject(projectId: string) {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  function setNote(projectId: string, note: string) {
    setProgressNotes((prev) => ({ ...prev, [projectId]: note }));
  }

  function setProjectStatus(projectId: string, status: string) {
    setProjectStatuses((prev) => ({ ...prev, [projectId]: status }));
  }

  async function handleAddProject() {
    if (!newProjectTitle.trim()) return;
    setAddingProject(true);
    try {
      const res = await fetch("/api/reports/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newProjectTitle.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add project");
        return;
      }
      const project: Project = await res.json();
      setProjects((prev) => [project, ...prev]);
      setProjectStatuses((prev) => ({ ...prev, [project.id]: project.status }));
      setSelectedProjects((prev) => new Set(Array.from(prev).concat(project.id)));
      setProgressNotes((prev) => ({ ...prev, [project.id]: "" }));
      setNewProjectTitle("");
    } catch {
      setError("Failed to add project");
    } finally {
      setAddingProject(false);
    }
  }

  async function handleSave(action: "save" | "submit") {
    setError(null);
    setSaving(true);

    try {
      const projectUpdates = Array.from(selectedProjects).map((projectId) => ({
        projectId,
        progressNote: progressNotes[projectId] ?? "",
      }));

      // Update project statuses for changed ones
      for (const [projectId, status] of Object.entries(projectStatuses)) {
        const original = projects.find((p) => p.id === projectId);
        if (original && original.status !== status) {
          await fetch(`/api/reports/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
        }
      }

      let reportId = report?.id;

      if (!isEdit) {
        // Create the report first
        const createRes = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            periodStart,
            periodEnd,
            teamId: teamId || null,
            accomplishments: accomplishments || null,
            priorities:      priorities      || null,
            blockers:        blockers        || null,
          }),
        });

        if (!createRes.ok) {
          const data = await createRes.json();
          setError(data.error ?? "Failed to create report");
          return;
        }

        const created = await createRes.json();
        reportId = created.id;
      }

      // PATCH the report with content + project updates + optional submit
      const patchRes = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          accomplishments: accomplishments || null,
          priorities:      priorities      || null,
          blockers:        blockers        || null,
          teamId:          teamId || null,
          projectUpdates,
        }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json();
        setError(data.error ?? "Failed to save report");
        return;
      }

      router.push("/reports");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Report Period + Team */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Report Details
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Period Start <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                disabled={isEdit}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Period End <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                disabled={isEdit}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— No team —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Accomplishments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            This Week&apos;s Accomplishments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            What did you complete or make progress on this week?
          </p>
        </div>
        <div className="px-6 py-5">
          <textarea
            rows={4}
            value={accomplishments}
            onChange={(e) => setAccomplishments(e.target.value)}
            placeholder="- Completed the authentication refactor&#10;- Reviewed 3 pull requests&#10;- Attended sprint planning meeting"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Priorities */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Next Week&apos;s Priorities
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            What are your top priorities for the coming week?
          </p>
        </div>
        <div className="px-6 py-5">
          <textarea
            rows={4}
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
            placeholder="- Finish API integration for the reports module&#10;- Code review for team PRs&#10;- Meet with stakeholders about Q2 roadmap"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Blockers */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Blockers / Needs Help
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Anything blocking progress or where you need support?
          </p>
        </div>
        <div className="px-6 py-5">
          <textarea
            rows={3}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="- Waiting on approval from legal for the vendor contract&#10;- Need access to the production logs"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Key Projects */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Key Projects
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select projects to include in this report and add progress notes.
          </p>
        </div>

        <div className="divide-y divide-gray-50">
          {projects.length === 0 && (
            <div className="px-6 py-4 text-sm text-slate-400 italic">
              No projects yet. Add one below.
            </div>
          )}

          {projects.map((project) => {
            const isSelected = selectedProjects.has(project.id);
            return (
              <div key={project.id} className={`px-6 py-4 transition-colors ${isSelected ? "bg-blue-50/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleProject(project.id)}
                    className="mt-0.5 flex-shrink-0 text-blue-600"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{project.title}</span>
                      <select
                        value={projectStatuses[project.id] ?? project.status}
                        onChange={(e) => setProjectStatus(project.id, e.target.value)}
                        className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-slate-600 focus:border-blue-400 focus:outline-none"
                      >
                        {PROJECT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isSelected && (
                      <textarea
                        rows={2}
                        value={progressNotes[project.id] ?? ""}
                        onChange={(e) => setNote(project.id, e.target.value)}
                        placeholder="Progress note for this week…"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new project inline */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Add New Project
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddProject();
                }
              }}
              placeholder="Project title…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddProject}
              disabled={addingProject || !newProjectTitle.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {addingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
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
          type="button"
          onClick={() => handleSave("save")}
          disabled={saving || isSubmitted}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave("submit")}
          disabled={saving || isSubmitted}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitted ? "Already Submitted" : "Submit Report"}
        </button>
      </div>
    </div>
  );
}
