import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { AddUserModal } from "@/components/admin/AddUserModal";

export const metadata = { title: "User Management" };

export default async function UsersPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_USERS)) redirect("/admin");

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { userRoles: { include: { role: true } } },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <Header
        title="User Management"
        subtitle={`${users.filter((u) => u.isActive).length} active users`}
        actions={<AddUserModal roles={roles} />}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.userRoles.map((ur) => (
                      <span key={ur.role.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {ur.role.name}
                      </span>
                    ))}
                    {user.userRoles.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No role</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={user.isActive ? "published" : "archived"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-500">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4 text-right">
                  <UserActionsMenu user={{ id: user.id, name: user.name, email: user.email, isActive: user.isActive, roleIds: user.userRoles.map((ur) => ur.role.id) }} roles={roles} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
