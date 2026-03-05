import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PolicyForm } from "@/components/policies/PolicyForm";

export const metadata = { title: "Edit Policy" };

export default async function EditPolicyPage({ params }: { params: { id: string } }) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.POLICIES_UPDATE)) redirect("/policies");

  const [policy, tags] = await Promise.all([
    prisma.policy.findUnique({
      where: { id: params.id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!policy) notFound();

  return (
    <div>
      <Header title="Edit Policy" subtitle={policy.title} />
      <PolicyForm mode="edit" policy={policy} tags={tags} />
    </div>
  );
}
