import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { TeamForm } from "@/components/reports/TeamForm";

export const metadata = { title: "Edit Team" };

export default async function EditTeamPage({ params }: { params: { id: string } }) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.REPORTS_MANAGE)) redirect("/admin");

  const [team, users] = await Promise.all([
    prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: { select: { userId: true } },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!team) notFound();

  const teamData = {
    id:             team.id,
    name:           team.name,
    description:    team.description,
    leadId:         team.leadId,
    memberIds:      team.members.map((m) => m.userId),
    reportsEnabled: team.reportsEnabled,
  };

  return (
    <div>
      <Header
        title="Edit Team"
        subtitle={`Editing "${team.name}"`}
      />
      <div className="max-w-2xl">
        <TeamForm users={users} team={teamData} />
      </div>
    </div>
  );
}
