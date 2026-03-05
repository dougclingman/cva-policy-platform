import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { Users, KeyRound, Link2, Bell, BarChart2, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_VIEW)) redirect("/dashboard");

  const [userCount, roleCount, ssoConfig, emailConfig, totalViews] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.role.count(),
    prisma.sSOConfig.findFirst(),
    prisma.emailConfig.findFirst(),
    prisma.policyView.count(),
  ]);

  const sections = [
    {
      href:       "/admin/users",
      label:      "User Management",
      desc:       "Add, edit, deactivate users and assign roles",
      icon:       Users,
      stat:       `${userCount} active users`,
      permission: PERMISSIONS.ADMIN_USERS,
      color:      "text-blue-600 bg-blue-50",
    },
    {
      href:       "/admin/roles",
      label:      "Roles & Permissions",
      desc:       "Manage roles and their permission sets",
      icon:       KeyRound,
      stat:       `${roleCount} roles`,
      permission: PERMISSIONS.ADMIN_ROLES,
      color:      "text-purple-600 bg-purple-50",
    },
    {
      href:       "/admin/sso",
      label:      "SSO Configuration",
      desc:       "Configure SAML/OIDC single sign-on",
      icon:       Link2,
      stat:       ssoConfig?.isEnabled ? "Enabled" : "Not configured",
      permission: PERMISSIONS.ADMIN_SSO,
      color:      "text-green-600 bg-green-50",
      statusOk:   ssoConfig?.isEnabled,
    },
    {
      href:       "/admin/notifications",
      label:      "Email Notifications",
      desc:       "Configure SMTP and notification triggers",
      icon:       Bell,
      stat:       emailConfig?.isEnabled ? "Configured" : "Not configured",
      permission: PERMISSIONS.ADMIN_NOTIFICATIONS,
      color:      "text-orange-600 bg-orange-50",
      statusOk:   emailConfig?.isEnabled,
    },
    {
      href:       "/admin/analytics",
      label:      "Analytics",
      desc:       "Most accessed policies and viewer comments",
      icon:       BarChart2,
      stat:       `${totalViews.toLocaleString()} total views`,
      permission: PERMISSIONS.ADMIN_VIEW,
      color:      "text-teal-600 bg-teal-50",
    },
  ];

  const visible = sections.filter((s) => hasPermission(permissions, s.permission));

  return (
    <div>
      <Header
        title="Administration"
        subtitle="Manage users, roles, SSO, and notification settings"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={`inline-flex rounded-xl p-3 ${section.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                {"statusOk" in section && (
                  <span className="flex items-center gap-1 text-xs">
                    {section.statusOk ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300" />
                    )}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                {section.label}
              </h3>
              <p className="text-sm text-slate-500 mb-3">{section.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 bg-gray-100 rounded-full px-2.5 py-1">
                  {section.stat}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
