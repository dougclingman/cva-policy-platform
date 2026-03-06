"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

// Dynamic import to avoid SSR issues
const GanttChart = dynamic(
  () => import("gantt-task-react").then((m) => ({ default: m.Gantt })),
  { ssr: false }
);

export interface ProjectTaskWithDependencies {
  id: string;
  title: string;
  status: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  assignee?: { name: string } | null;
  dependsOn: Array<{
    dependencyTask: { id: string; title: string };
  }>;
}

interface GanttViewProps {
  tasks: ProjectTaskWithDependencies[];
}

const VIEW_MODE_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "Day",   value: "Day" as ViewMode },
  { label: "Week",  value: "Week" as ViewMode },
  { label: "Month", value: "Month" as ViewMode },
];

function statusToProgress(status: string): number {
  if (status === "COMPLETED")   return 100;
  if (status === "IN_PROGRESS") return 50;
  if (status === "BLOCKED")     return 25;
  return 0;
}

export function GanttView({ tasks }: GanttViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Week" as ViewMode);

  const ganttTasks: Task[] = tasks
    .filter((t) => t.startDate && t.endDate)
    .map((t) => ({
      id:           t.id,
      name:         t.title,
      start:        new Date(t.startDate!),
      end:          new Date(t.endDate!),
      progress:     statusToProgress(t.status),
      dependencies: t.dependsOn.map((d) => d.dependencyTask.id),
      type:         "task" as const,
      styles: {
        progressColor:
          t.status === "COMPLETED"
            ? "#16a34a"
            : t.status === "BLOCKED"
            ? "#dc2626"
            : t.status === "IN_PROGRESS"
            ? "#2563eb"
            : "#94a3b8",
        progressSelectedColor:
          t.status === "COMPLETED"
            ? "#15803d"
            : t.status === "BLOCKED"
            ? "#b91c1c"
            : t.status === "IN_PROGRESS"
            ? "#1d4ed8"
            : "#64748b",
      },
    }));

  if (ganttTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">No tasks with dates set</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Add start and end dates to tasks to see them in the Gantt chart.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* View mode switcher */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {VIEW_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setViewMode(opt.value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === opt.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="rounded-lg border border-gray-200 overflow-x-auto">
        <GanttChart
          tasks={ganttTasks}
          viewMode={viewMode}
          listCellWidth="200px"
          columnWidth={viewMode === "Day" ? 40 : viewMode === "Week" ? 120 : 200}
          rowHeight={40}
          fontSize="12px"
          ganttHeight={Math.min(ganttTasks.length * 40 + 60, 500)}
          todayColor="rgba(37, 99, 235, 0.08)"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-400" />
          To Do
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-600" />
          In Progress
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-600" />
          Blocked
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-600" />
          Completed
        </div>
      </div>
    </div>
  );
}
