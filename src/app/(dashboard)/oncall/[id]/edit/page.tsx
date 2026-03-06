import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { OnCallForm } from "@/components/oncall/OnCallForm";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const entry = await prisma.onCallEntry.findUnique({
    where:  { id: params.id },
    include: { user: { select: { name: true } } },
  });
  return { title: `Edit On-Call: ${entry?.user?.name ?? "Entry"}` };
}

export default async function EditOnCallPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ONCALL_MANAGE)) {
    redirect("/oncall");
  }

  const [entry, users] = await Promise.all([
    prisma.onCallEntry.findUnique({
      where:   { id: params.id },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!entry) notFound();

  const formEntry = {
    id:            entry.id,
    userId:        entry.userId,
    startDate:     entry.startDate.toISOString().split("T")[0],
    endDate:       entry.endDate.toISOString().split("T")[0],
    phoneOverride: entry.phoneOverride,
    notes:         entry.notes,
  };

  return (
    <div>
      <Header
        title="Edit On-Call Entry"
        subtitle={`Editing on-call assignment for ${entry.user.name}`}
      />
      <div className="mt-4 max-w-3xl">
        <OnCallForm users={users} entry={formEntry} />
      </div>
    </div>
  );
}
