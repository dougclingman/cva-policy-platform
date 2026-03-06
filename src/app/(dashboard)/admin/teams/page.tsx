import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { ReportConfigForm } from "@/components/reports/ReportConfigForm";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Users, Plus, Pencil, Settings } from "lucide-react";
import { DeleteTeamButton } from "@/components/reports/DeleteTeamButton";

export const metadata = { title: "Team Management" };

const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const INTERVAL_LABELS: Record<string, string> = {
  WEEKLY:   "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY:  "Monthly",
};

export default async function TeamsPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_VIEW)) redirect("/admin");

  const canManage = hasPermission(permissions, PERMISSIONS.REPORTS_MANAGE);

  const [teams, reportConfig] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        lead: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.reportConfig.findFirst(),
  ]);

  return (
    <div>
      <Header
        title="Team Management"
        subtitle={`${teams.length} team${teams.length !== 1 ? "s" : ""} configured`}
        actions={
          canManage ? (
            <Link
              href="/admin/teams/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Team
            </Link>
          ) : undefined
        }
      />

      {/* Report Configuration Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="inline-flex rounded-lg p-2 bg-purple-50 text-purple-600">
            <Settings className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">Report Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {reportConfig
                ? `${INTERVAL_LABELS[reportConfig.interval]} reports due on ${DAY_NAMES[reportConfig.dueDayOfWeek]}s · ${reportConfig.reminderDays} day reminder · ${reportConfig.isEnabled ? "Enabled" : "Disabled"}`
                : "Not configured yet"}
            </p>
          </div>
          {reportConfig && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              reportConfig.isEnabled
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {reportConfig.isEnabled ? "Enabled" : "Disabled"}
            </span>
          )}
        </div>

        {canManage && (
          <div className="px-6 py-5">
            <ReportConfigForm config={reportConfig} />
          </div>
        )}

        {!canManage && reportConfig && (
          <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Interval</p>
              <p className="text-sm font-semibold text-slate-900">{INTERVAL_LABELS[reportConfig.interval]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Due Day</p>
              <p className="text-sm font-semibold text-slate-900">{DAY_NAMES[reportConfig.dueDayOfWeek]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Reminder</p>
              <p className="text-sm font-semibold text-slate-900">{reportConfig.reminderDays} day{reportConfig.reminderDays !== 1 ? "s" : ""} before</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</p>
              <p className="text-sm font-semibold text-slate-900">{reportConfig.isEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="inline-flex rounded-lg p-2 bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-slate-900">Teams</h2>
        </div>

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Users className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No teams yet</p>
            {canManage && (
              <Link
                href="/admin/teams/new"
                className="mt-3 text-sm text-blue-600 hover:underline font-medium"
              >
                Create your first team
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Team Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{team.name}</div>
                    {team.description && (
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                        {team.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{team.lead.name}</div>
                    <div className="text-xs text-slate-400">{team.lead.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      <Users className="h-3 w-3" />
                      {team._count.members}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {team.reportsEnabled ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(team.createdAt)}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/teams/${team.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                        <DeleteTeamButton teamId={team.id} teamName={team.name} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
