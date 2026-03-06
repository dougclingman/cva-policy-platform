import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { RunbookForm } from "@/components/runbooks/RunbookForm";

export const metadata = { title: "Edit Runbook" };

export default async function EditRunbookPage({ params }: { params: { id: string } }) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.RUNBOOKS_MANAGE)) {
    redirect("/dashboard");
  }

  const [runbook, tags] = await Promise.all([
    prisma.runbook.findUnique({
      where: { id: params.id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!runbook) notFound();

  const runbookData = {
    id:       runbook.id,
    title:    runbook.title,
    summary:  runbook.summary,
    category: runbook.category,
    content:  runbook.content,
    tagIds:   runbook.tags.map((t) => t.tagId),
  };

  return (
    <div>
      <Header title="Edit Runbook" subtitle={runbook.title} />
      <RunbookForm tags={tags} runbook={runbookData} />
    </div>
  );
}
