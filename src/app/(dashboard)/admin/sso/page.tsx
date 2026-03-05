import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { SSOConfigForm } from "@/components/admin/SSOConfigForm";

export const metadata = { title: "SSO Configuration" };

export default async function SSOPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_SSO)) redirect("/admin");

  const [config, roles] = await Promise.all([
    prisma.sSOConfig.findFirst(),
    prisma.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="max-w-3xl">
      <Header
        title="SSO Configuration"
        subtitle="Configure SAML 2.0 or OIDC single sign-on for your organization"
      />
      <SSOConfigForm config={config} roles={roles} />
    </div>
  );
}
