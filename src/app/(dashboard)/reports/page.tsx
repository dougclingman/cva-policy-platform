import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { FileText, Plus, ChevronRight } from "lucide-react";

export const metadata = { title: "Weekly Reports" };

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId      = session.user.id;
  const permissions = session.user.permissions ?? [];
  const canSubmit   = hasPermission(permissions, PERMISSIONS.REPORTS_SUBMIT);
  const canManage   = hasPermission(permissions, PERMISSIONS.REPORTS_MANAGE);

  const [reports, leadTeamCount] = await Promise.all([
    prisma.staffReport.findMany({
      where: { userId },
      orderBy: { periodStart: "desc" },
      include: {
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.team.count({ where: { leadId: userId } }),
  ]);

  const isTeamLead = leadTeamCount > 0;
  const showManageLink = canManage || isTeamLead;

  return (
    <div>
      <Header
        title="My Weekly Reports"
        subtitle={`${reports.length} report${reports.length !== 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-3">
            {showManageLink && (
              <Link
                href="/reports/manage"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
              >
                Team Reports
              </Link>
            )}
            {canSubmit && (
              <Link
                href="/reports/new"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Report
              </Link>
            )}
          </div>
        }
      />

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <FileText className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No reports yet</p>
          {canSubmit && (
            <Link
              href="/reports/new"
              className="mt-3 text-sm text-blue-600 hover:underline font-medium"
            >
              Submit your first weekly report
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
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
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
                    </div>
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
        </div>
      )}
    </div>
  );
}
