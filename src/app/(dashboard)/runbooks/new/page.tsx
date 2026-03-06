import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { RunbookForm } from "@/components/runbooks/RunbookForm";

export const metadata = { title: "New Runbook" };

export default async function NewRunbookPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.RUNBOOKS_MANAGE)) {
    redirect("/dashboard");
  }

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <Header title="New Runbook" subtitle="Create a new runbook for your team" />
      <RunbookForm tags={tags} />
    </div>
  );
}
