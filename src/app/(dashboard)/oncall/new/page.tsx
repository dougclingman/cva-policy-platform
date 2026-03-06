import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { OnCallForm } from "@/components/oncall/OnCallForm";

export const metadata = { title: "Add On-Call Entry" };

export default async function NewOnCallPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ONCALL_MANAGE)) {
    redirect("/oncall");
  }

  const users = await prisma.user.findMany({
    where:   { isActive: true },
    select:  { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Header
        title="Add On-Call Entry"
        subtitle="Schedule a team member for an on-call rotation"
      />
      <div className="mt-4 max-w-3xl">
        <OnCallForm users={users} />
      </div>
    </div>
  );
}
