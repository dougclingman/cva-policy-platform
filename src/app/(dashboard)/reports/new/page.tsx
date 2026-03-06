import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { StaffReportForm } from "@/components/reports/StaffReportForm";

export const metadata = { title: "New Report" };

function getMondayOfWeek(date: Date): Date {
  const d    = new Date(date);
  const day  = d.getDay(); // 0=Sun, 1=Mon, ...
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

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function NewReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const permissions = session.user.permissions ?? [];
  if (!hasPermission(permissions, PERMISSIONS.REPORTS_SUBMIT)) redirect("/reports");

  const today   = new Date();
  const monday  = getMondayOfWeek(today);
  const friday  = getFridayOfWeek(today);

  const [teamMemberships, projects] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: { team: { select: { id: true, name: true } } },
    }),
    prisma.staffProject.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const teams = teamMemberships.map((tm) => tm.team);

  return (
    <div>
      <Header
        title="New Weekly Report"
        subtitle={`Week of ${toDateString(monday)} – ${toDateString(friday)}`}
      />
      <StaffReportForm
        teams={teams}
        projects={projects}
        defaultPeriodStart={toDateString(monday)}
        defaultPeriodEnd={toDateString(friday)}
      />
    </div>
  );
}
