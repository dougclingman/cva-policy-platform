import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, Users, Pencil, CheckCircle2, AlertCircle, Layers } from "lucide-react";

export const metadata = { title: "View Report" };

const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE:    "Active",
  ON_HOLD:   "On Hold",
  COMPLETED: "Completed",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700",
  ON_HOLD:   "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-gray-100 text-gray-600",
};

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const permissions = session.user.permissions ?? [];
  const canManage   = hasPermission(permissions, PERMISSIONS.REPORTS_MANAGE);

  const report = await prisma.staffReport.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      projectUpdates: {
        include: {
          project: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!report) notFound();

  if (report.userId !== session.user.id && !canManage) redirect("/reports");

  const isOwner   = report.userId === session.user.id;
  const canEdit   = isOwner && report.status === "DRAFT";

  // If edit mode is needed, fetch teams + projects for the form
  // For view mode, just render the formatted view

  return (
    <div>
      <Header
        title={`Report: ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`}
        subtitle={report.user.name}
        actions={
          canEdit ? (
            <Link
              href={`/reports/${report.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit Report
            </Link>
          ) : undefined
        }
      />

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>
              {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
            </span>
          </div>
          {report.team && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4 text-slate-400" />
              <span>{report.team.name}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            {report.submittedAt && (
              <span className="text-xs text-slate-400">
                Submitted {formatDate(report.submittedAt)}
              </span>
            )}
            <Badge variant={report.status === "SUBMITTED" ? "published" : "draft"}>
              {report.status === "SUBMITTED" ? "Submitted" : "Draft"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Accomplishments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h2 className="font-semibold text-slate-900">Accomplishments</h2>
          </div>
          <div className="px-6 py-4">
            {report.accomplishments ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.accomplishments}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No accomplishments recorded.</p>
            )}
          </div>
        </div>

        {/* Priorities */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-slate-900">Next Week&apos;s Priorities</h2>
          </div>
          <div className="px-6 py-4">
            {report.priorities ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.priorities}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No priorities recorded.</p>
            )}
          </div>
        </div>

        {/* Blockers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-slate-900">Blockers / Needs Help</h2>
          </div>
          <div className="px-6 py-4">
            {report.blockers ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.blockers}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No blockers reported.</p>
            )}
          </div>
        </div>

        {/* Project Updates */}
        {report.projectUpdates.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-slate-900">Project Updates</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {report.projectUpdates.map((pu) => (
                <div key={pu.id} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800">
                      {pu.project.title}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_COLORS[pu.project.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {PROJECT_STATUS_LABELS[pu.project.status] ?? pu.project.status}
                    </span>
                  </div>
                  {pu.progressNote ? (
                    <p className="text-sm text-slate-600 leading-relaxed">{pu.progressNote}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No progress note.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
