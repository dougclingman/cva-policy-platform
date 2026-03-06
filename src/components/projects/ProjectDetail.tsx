"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Edit, Plus, Trash2, ListTodo, BarChart3 } from "lucide-react";
import { TaskDrawer } from "@/components/projects/TaskDrawer";
import { GanttView } from "@/components/projects/GanttView";

// ─── Types ────────────────────────────────────────────────────────────────────

type SimpleUser = {
  id:    string;
  name:  string;
  email: string;
};

type TaskDependency = {
  dependentTaskId:  string;
  dependencyTaskId: string;
  dependencyTask: {
    id:    string;
    title: string;
  };
};

type ProjectTask = {
  id:          string;
  projectId:   string;
  title:       string;
  description: string | null;
  status:      "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  priority:    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  startDate:   Date | null;
  endDate:     Date | null;
  assigneeId:  string | null;
  reminderDays: number;
  createdById: string;
  createdAt:   Date;
  updatedAt:   Date;
  assignee:    SimpleUser | null;
  dependsOn:   TaskDependency[];
};

type ProjectMember = {
  projectId: string;
  userId:    string;
  role:      string | null;
  joinedAt:  Date;
  user:      SimpleUser;
};

type Team = {
  id:   string;
  name: string;
};

type ProjectWithAll = {
  id:          string;
  title:       string;
  description: string | null;
  status:      "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate:   Date | null;
  endDate:     Date | null;
  teamId:      string | null;
  createdById: string;
  createdAt:   Date;
  updatedAt:   Date;
  team:        Team | null;
  createdBy:   { name: string };
  members:     ProjectMember[];
  tasks:       ProjectTask[];
};

type Props = {
  project:  ProjectWithAll;
  canManage: boolean;
  allUsers:  SimpleUser[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function projectStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string; dot: string }> = {
    PLANNING:  { label: "Planning",  className: "bg-gray-100 text-gray-700",   dot: "bg-gray-400" },
    ACTIVE:    { label: "Active",    className: "bg-green-100 text-green-800", dot: "bg-green-500" },
    ON_HOLD:   { label: "On Hold",   className: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
    COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-800",   dot: "bg-blue-500" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700",     dot: "bg-red-500" },
  };
  return map[status] ?? { label: status, className: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
}

function taskStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    TODO:        { label: "To Do",       className: "bg-gray-100 text-gray-600" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
    BLOCKED:     { label: "Blocked",     className: "bg-red-100 text-red-700" },
    COMPLETED:   { label: "Completed",   className: "bg-green-100 text-green-800" },
    CANCELLED:   { label: "Cancelled",   className: "bg-gray-100 text-gray-500" },
  };
  return map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
}

function taskPriorityBadge(priority: string) {
  const map: Record<string, { label: string; className: string }> = {
    LOW:      { label: "Low",      className: "bg-gray-100 text-gray-600" },
    MEDIUM:   { label: "Medium",   className: "bg-blue-100 text-blue-700" },
    HIGH:     { label: "High",     className: "bg-orange-100 text-orange-700" },
    CRITICAL: { label: "Critical", className: "bg-red-100 text-red-700" },
  };
  return map[priority] ?? { label: priority, className: "bg-gray-100 text-gray-600" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectDetail({ project, canManage, allUsers }: Props) {
  const [activeTab, setActiveTab]   = useState<"tasks" | "gantt">("tasks");
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [addingTask, setAddingTask] = useState(false);

  const totalTasks     = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
  const pct            = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const statusInfo     = projectStatusBadge(project.status);

  const drawerOpen = addingTask || activeTask !== null;

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await fetch(`/api/projects/${project.id}/tasks/${taskId}`, { method: "DELETE" });
    // Reload page to refresh task list
    window.location.reload();
  }

  return (
    <div>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </Link>
      </div>

      {/* Project Header Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusInfo.className,
                ].join(" ")}
              >
                <span className={["h-1.5 w-1.5 rounded-full", statusInfo.dot].join(" ")} />
                {statusInfo.label}
              </span>
              {project.team && (
                <span className="text-sm text-slate-500">{project.team.name}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{project.title}</h1>
            {project.description && (
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{project.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {(project.startDate || project.endDate) && (
                <span>
                  {project.startDate ? formatDate(project.startDate) : "—"}
                  {" – "}
                  {project.endDate ? formatDate(project.endDate) : "—"}
                </span>
              )}
              <span>{project.members.length} member{project.members.length !== 1 ? "s" : ""}</span>
              <span>Created by {project.createdBy.name}</span>
            </div>
          </div>

          {canManage && (
            <Link
              href={`/projects/${project.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Project
            </Link>
          )}
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
              <span>{completedTasks}/{totalTasks} tasks completed</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("tasks")}
          className={[
            "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "tasks"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          <ListTodo className="h-4 w-4" />
          Tasks
          {totalTasks > 0 && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
              {totalTasks}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("gantt")}
          className={[
            "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "gantt"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          <BarChart3 className="h-4 w-4" />
          Gantt Chart
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Add Task header */}
          {canManage && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <span className="text-sm font-medium text-slate-600">
                {totalTasks === 0 ? "No tasks yet" : `${totalTasks} task${totalTasks !== 1 ? "s" : ""}`}
              </span>
              <button
                onClick={() => setAddingTask(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Task
              </button>
            </div>
          )}

          {project.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <ListTodo className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No tasks have been added yet.</p>
              {canManage && (
                <button
                  onClick={() => setAddingTask(true)}
                  className="mt-3 text-sm text-blue-500 hover:text-blue-600"
                >
                  Add the first task
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Assignee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Start</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">End</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Dependencies</th>
                    {canManage && (
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {project.tasks.map((task) => {
                    const statusInfo   = taskStatusBadge(task.status);
                    const priorityInfo = taskPriorityBadge(task.priority);
                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => setActiveTask(task)}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-slate-900 line-clamp-1">{task.title}</span>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {task.assignee ? (
                            <span className="text-sm">{task.assignee.name}</span>
                          ) : (
                            <span className="text-slate-300">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {task.startDate ? formatDate(task.startDate) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {task.endDate ? formatDate(task.endDate) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={["inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", priorityInfo.className].join(" ")}>
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={["inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", statusInfo.className].join(" ")}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {task.dependsOn.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.dependsOn.map((dep) => (
                                <span
                                  key={dep.dependencyTaskId}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 line-clamp-1"
                                >
                                  {dep.dependencyTask.title}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Gantt Tab */}
      {activeTab === "gantt" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <GanttView tasks={project.tasks} />
        </div>
      )}

      {/* Task Drawer */}
      {drawerOpen && (
        <TaskDrawer
          projectId={project.id}
          task={activeTask ?? undefined}
          allUsers={allUsers}
          allTasks={project.tasks}
          onClose={() => {
            setActiveTask(null);
            setAddingTask(false);
          }}
          onSaved={() => {
            setActiveTask(null);
            setAddingTask(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
