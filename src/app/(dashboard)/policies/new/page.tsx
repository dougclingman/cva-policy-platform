import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PolicyForm } from "@/components/policies/PolicyForm";

export const metadata = { title: "New Policy" };

export default async function NewPolicyPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.POLICIES_CREATE)) redirect("/policies");

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <Header title="New Policy" subtitle="Create a new IT policy document" />
      <PolicyForm mode="create" tags={tags} />
    </div>
  );
}
