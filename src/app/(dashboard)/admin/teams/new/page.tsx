import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { TeamForm } from "@/components/reports/TeamForm";

export const metadata = { title: "New Team" };

export default async function NewTeamPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.REPORTS_MANAGE)) redirect("/admin");

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Header
        title="New Team"
        subtitle="Create a new team and assign members"
      />
      <div className="max-w-2xl">
        <TeamForm users={users} />
      </div>
    </div>
  );
}
