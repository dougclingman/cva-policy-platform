import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { StaffReportForm } from "@/components/reports/StaffReportForm";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Edit Report" };

export default async function EditReportPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const permissions = session.user.permissions ?? [];
  const canManage   = hasPermission(permissions, PERMISSIONS.REPORTS_MANAGE);

  const report = await prisma.staffReport.findUnique({
    where: { id: params.id },
    include: {
      projectUpdates: {
        select: { projectId: true, progressNote: true },
      },
    },
  });

  if (!report) notFound();

  const isOwner = report.userId === session.user.id;
  if (!isOwner && !canManage) redirect("/reports");
  if (report.status !== "DRAFT" && !canManage) redirect(`/reports/${params.id}`);

  const [teamMemberships, projects] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: { team: { select: { id: true, name: true } } },
    }),
    prisma.staffProject.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const teams = teamMemberships.map((tm) => tm.team);

  const reportData = {
    id:             report.id,
    periodStart:    report.periodStart.toISOString(),
    periodEnd:      report.periodEnd.toISOString(),
    accomplishments: report.accomplishments,
    priorities:     report.priorities,
    blockers:       report.blockers,
    teamId:         report.teamId,
    status:         report.status,
    projectUpdates: report.projectUpdates.map((pu) => ({
      projectId:    pu.projectId,
      progressNote: pu.progressNote ?? "",
    })),
  };

  return (
    <div>
      <Header
        title="Edit Report"
        subtitle={`${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`}
      />
      <StaffReportForm
        teams={teams}
        projects={projects}
        report={reportData}
      />
    </div>
  );
}
