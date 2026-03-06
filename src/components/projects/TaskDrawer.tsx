"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface SimpleUser {
  id: string;
  name: string;
  email: string;
}

interface TaskDependency {
  dependentTaskId: string;
  dependencyTaskId: string;
  dependencyTask: {
    id: string;
    title: string;
  };
}

interface ProjectTaskFull {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  assigneeId?: string | null;
  reminderDays: number;
  dependsOn?: TaskDependency[];
}

interface TaskDrawerProps {
  projectId: string;
  /** Existing task for edit mode; undefined/null = create mode */
  task?: ProjectTaskFull | null;
  /** All tasks in the project (for dependency selection) */
  allTasks: Array<{ id: string; title: string }>;
  /** All users available for assignment */
  allUsers: SimpleUser[];
  onClose: () => void;
  onSaved: () => void;
}

const TASK_STATUSES = [
  { value: "TODO",        label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED",     label: "Blocked" },
  { value: "COMPLETED",   label: "Completed" },
  { value: "CANCELLED",   label: "Cancelled" },
];

const TASK_PRIORITIES = [
  { value: "LOW",      label: "Low" },
  { value: "MEDIUM",   label: "Medium" },
  { value: "HIGH",     label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

function toDateInputValue(date?: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TaskDrawer({
  projectId,
  task,
  allTasks,
  allUsers,
  onClose,
  onSaved,
}: TaskDrawerProps) {
  const isEdit = !!task?.id;

  const existingDependencyIds = task?.dependsOn?.map((d) => d.dependencyTask.id) ?? [];

  const [title,         setTitle]         = useState(task?.title ?? "");
  const [description,   setDescription]   = useState(task?.description ?? "");
  const [assigneeId,    setAssigneeId]    = useState(task?.assigneeId ?? "");
  const [startDate,     setStartDate]     = useState(() => toDateInputValue(task?.startDate));
  const [endDate,       setEndDate]       = useState(() => toDateInputValue(task?.endDate));
  const [priority,      setPriority]      = useState(task?.priority ?? "MEDIUM");
  const [status,        setStatus]        = useState(task?.status ?? "TODO");
  const [dependencyIds, setDependencyIds] = useState<string[]>(existingDependencyIds);
  const [reminderDays,  setReminderDays]  = useState(task?.reminderDays ?? 1);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  function toggleDependency(id: string) {
    setDependencyIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
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
      const url    = isEdit
        ? `/api/projects/${projectId}/tasks/${task!.id}`
        : `/api/projects/${projectId}/tasks`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:             title.trim(),
          description:       description.trim() || null,
          status,
          priority,
          startDate:         startDate || null,
          endDate:           endDate || null,
          assigneeId:        assigneeId || null,
          reminderDays,
          dependencyTaskIds: dependencyIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save task");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Available tasks for dependency selection (exclude self)
  const availableTasks = isEdit
    ? allTasks.filter((t) => t.id !== task!.id)
    : allTasks;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="w-96 bg-white shadow-xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-900">
            {isEdit ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          <form id="task-drawer-form" onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="task-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Configure firewall rules"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-desc">
                Description
              </label>
              <textarea
                id="task-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details or acceptance criteria..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-assignee">
                Assignee
              </label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="">— Unassigned —</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-start">
                  Start Date
                </label>
                <input
                  id="task-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-end">
                  End Date
                </label>
                <input
                  id="task-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Reminder Days */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="task-reminder">
                Reminder Days
                <span className="ml-1 text-[10px] font-normal text-slate-400">
                  Days before end date
                </span>
              </label>
              <input
                id="task-reminder"
                type="number"
                min={0}
                value={reminderDays}
                onChange={(e) => setReminderDays(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Dependencies */}
            {availableTasks.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dependencies
                  <span className="ml-1 text-[10px] font-normal text-slate-400">
                    Tasks that must complete first
                  </span>
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 max-h-36 overflow-y-auto space-y-1">
                  {availableTasks.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={dependencyIds.includes(t.id)}
                        onChange={() => toggleDependency(t.id)}
                        className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-700 truncate">{t.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-drawer-form"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
