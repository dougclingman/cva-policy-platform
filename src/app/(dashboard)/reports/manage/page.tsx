import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Users, FileText, CheckCircle2, Clock, ChevronRight } from "lucide-react";

export const metadata = { title: "Manage Reports" };

function getMondayOfWeek(date: Date): Date {
  const d    = new Date(date);
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getFridayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
}

export default async function ManageReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId      = session.user.id;
  const permissions = session.user.permissions ?? [];

  const isReportsManager = hasPermission(permissions, PERMISSIONS.REPORTS_MANAGE);

  // Find teams where the current user is the lead
  const leadTeams = await prisma.team.findMany({
    where: { leadId: userId },
    select: { id: true, name: true, reportsEnabled: true },
  });
  const isTeamLead = leadTeams.length > 0;

  if (!isReportsManager && !isTeamLead) redirect("/reports");

  const today  = new Date();
  const monday = getMondayOfWeek(today);
  const friday = getFridayOfWeek(today);

  // Determine which teams to show
  let teamsQuery;
  if (isReportsManager) {
    // Reports manager sees all teams with reportsEnabled
    teamsQuery = prisma.team.findMany({
      where: { reportsEnabled: true },
      orderBy: { name: "asc" },
      include: {
        lead: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  } else {
    // Team lead sees only their own teams that have reportsEnabled
    const enabledLeadTeamIds = leadTeams
      .filter((t) => t.reportsEnabled)
      .map((t) => t.id);

    teamsQuery = prisma.team.findMany({
      where: { id: { in: enabledLeadTeamIds } },
      orderBy: { name: "asc" },
      include: {
        lead: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  // Fetch all reports — managers see all, leads see only their teams
  let allReportsQuery;
  if (isReportsManager) {
    allReportsQuery = prisma.staffReport.findMany({
      orderBy: { periodStart: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });
  } else {
    const enabledLeadTeamIds = leadTeams
      .filter((t) => t.reportsEnabled)
      .map((t) => t.id);
    allReportsQuery = prisma.staffReport.findMany({
      where: { teamId: { in: enabledLeadTeamIds } },
      orderBy: { periodStart: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  const [teams, currentPeriodReports, allReports] = await Promise.all([
    teamsQuery,
    prisma.staffReport.findMany({
      where: {
        periodStart: { gte: monday },
        periodEnd:   { lte: friday },
      },
      include: {
        user: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    }),
    allReportsQuery,
  ]);

  // Build a map: userId -> report (for current period)
  const currentReportByUser = new Map(
    currentPeriodReports.map((r) => [r.userId, r])
  );

  return (
    <div>
      <Header
        title="Manage Reports"
        subtitle={`Current period: ${formatDate(monday)} – ${formatDate(friday)}`}
      />

      {/* Per-team completion cards */}
      {teams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            Current Period Completion
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => {
              const members       = team.members;
              const submitted     = members.filter(
                (m) => currentReportByUser.get(m.userId)?.status === "SUBMITTED"
              );
              const hasDraft      = members.filter(
                (m) => currentReportByUser.get(m.userId)?.status === "DRAFT"
              );
              const notStarted    = members.filter(
                (m) => !currentReportByUser.has(m.userId)
              );
              const total         = members.length;
              const pct           = total > 0 ? Math.round((submitted.length / total) * 100) : 0;

              return (
                <div key={team.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-lg p-1.5 bg-blue-50 text-blue-600">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{team.name}</h3>
                          <p className="text-xs text-slate-400">Lead: {team.lead.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {submitted.length}/{total}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          pct === 100 ? "bg-green-100 text-green-700" :
                          pct >= 50   ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                        }`}>{pct}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 w-full rounded-full bg-gray-100 h-1.5">
                      <div
                        className={`rounded-full h-1.5 transition-all ${
                          pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                    {members.map((m) => {
                      const report      = currentReportByUser.get(m.userId);
                      const isSubmitted = report?.status === "SUBMITTED";
                      const isDraft     = report?.status === "DRAFT";
                      return (
                        <div key={m.userId} className="flex items-center justify-between px-5 py-2.5">
                          <div>
                            <p className="text-sm text-slate-700">{m.user.name}</p>
                            <p className="text-xs text-slate-400">{m.user.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSubmitted ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <Link href={`/reports/${report!.id}`} className="text-xs text-blue-600 hover:underline">
                                  View
                                </Link>
                              </>
                            ) : isDraft ? (
                              <>
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <span className="text-xs text-yellow-600 font-medium">Draft</span>
                              </>
                            ) : (
                              <>
                                <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
                                <span className="text-xs text-slate-400">Not started</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {members.length === 0 && (
                      <p className="px-5 py-3 text-sm text-slate-400 italic">No members.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All submitted reports table */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          All Reports
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {allReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No reports submitted yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{report.user.name}</div>
                      <div className="text-xs text-slate-400">{report.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {report.team?.name ?? <span className="text-slate-300 italic">None</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={report.status === "SUBMITTED" ? "published" : "draft"}>
                        {report.status === "SUBMITTED" ? "Submitted" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {report.submittedAt ? formatDate(report.submittedAt) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
