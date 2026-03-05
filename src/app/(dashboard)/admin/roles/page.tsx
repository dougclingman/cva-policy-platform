import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { RolePermissionMatrix } from "@/components/admin/RolePermissionMatrix";

export const metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_ROLES)) redirect("/admin");

  const [roles, allPermissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    }),
    prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] }),
  ]);

  return (
    <div>
      <Header
        title="Roles & Permissions"
        subtitle="Manage role definitions and their permission sets"
      />

      <RolePermissionMatrix roles={roles} allPermissions={allPermissions} />
    </div>
  );
}
