import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, FolderKanban } from "lucide-react";

export const metadata = { title: "Projects" };

type StatusFilter = "ALL" | "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

function projectStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    PLANNING:  { label: "Planning",  className: "bg-gray-100 text-gray-700" },
    ACTIVE:    { label: "Active",    className: "bg-green-100 text-green-800" },
    ON_HOLD:   { label: "On Hold",   className: "bg-amber-100 text-amber-800" },
    COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-800" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  };
  return map[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
}

function projectStatusDot(status: string) {
  const map: Record<string, string> = {
    PLANNING:  "bg-gray-400",
    ACTIVE:    "bg-green-500",
    ON_HOLD:   "bg-amber-500",
    COMPLETED: "bg-blue-500",
    CANCELLED: "bg-red-500",
  };
  return map[status] ?? "bg-gray-400";
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "ALL",       label: "All" },
  { value: "PLANNING",  label: "Planning" },
  { value: "ACTIVE",    label: "Active" },
  { value: "ON_HOLD",   label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.PROJECTS_READ)) {
    redirect("/dashboard");
  }

  const userId     = session!.user.id;
  const canManage  = hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE);
  const rawStatus  = (searchParams.status ?? "ALL").toUpperCase() as StatusFilter;
  const activeTab  = STATUS_TABS.find((t) => t.value === rawStatus)?.value ?? "ALL";

  // Fetch projects scoped to user
  let projects;
  if (canManage) {
    projects = await prisma.project.findMany({
      include: {
        team:    true,
        members: true,
        tasks:   { select: { id: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } else {
    const userTeamIds = (
      await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } })
    ).map((t) => t.teamId);

    projects = await prisma.project.findMany({
      where: {
        OR: [
          { teamId: { in: userTeamIds } },
          { members: { some: { userId } } },
        ],
      },
      include: {
        team:    true,
        members: true,
        tasks:   { select: { id: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  // Apply status filter
  const filtered =
    activeTab === "ALL"
      ? projects
      : projects.filter((p) => p.status === activeTab);

  return (
    <div>
      <Header
        title="Projects"
        subtitle="Track IT projects, milestones, and task progress"
        actions={
          canManage ? (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          ) : undefined
        }
      />

      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "ALL"
              ? projects.length
              : projects.filter((p) => p.status === tab.value).length;
          const isActive = activeTab === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "ALL" ? "/projects" : `/projects?status=${tab.value.toLowerCase()}`}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {tab.label}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <FolderKanban className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {activeTab === "ALL" ? "No projects yet" : `No ${projectStatusBadge(activeTab).label.toLowerCase()} projects`}
          </p>
          {canManage && activeTab === "ALL" && (
            <p className="text-xs text-slate-400 mt-1">
              <Link href="/projects/new" className="text-blue-500 hover:text-blue-600">
                Create your first project
              </Link>{" "}
              to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const totalTasks     = project.tasks.length;
            const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
            const pct            = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const badge          = projectStatusBadge(project.status);
            const dot            = projectStatusDot(project.status);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      badge.className,
                    ].join(" ")}
                  >
                    <span className={["h-1.5 w-1.5 rounded-full", dot].join(" ")} />
                    {badge.label}
                  </span>
                  {project.team && (
                    <span className="text-xs text-slate-400">{project.team.name}</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 mb-1">
                  {project.title}
                </h3>

                {/* Date range */}
                {(project.startDate || project.endDate) && (
                  <p className="text-xs text-slate-400 mb-3">
                    {project.startDate ? formatDate(project.startDate) : "—"}
                    {" – "}
                    {project.endDate ? formatDate(project.endDate) : "—"}
                  </p>
                )}

                <div className="mt-auto pt-3 space-y-3">
                  {/* Task progress */}
                  {totalTasks > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">
                          {completedTasks}/{totalTasks} tasks
                        </span>
                        <span className="text-xs font-medium text-slate-600">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No tasks yet</p>
                  )}

                  {/* Member count */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {project.members.length === 0
                        ? "No members"
                        : `${project.members.length} member${project.members.length === 1 ? "" : "s"}`}
                    </span>
                    <span className="text-slate-300">Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
