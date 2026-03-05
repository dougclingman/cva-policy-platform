"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, ShieldCheck, Users, KeyRound,
  Link2, Bell, LogOut, ChevronRight, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
}

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/policies",  label: "Policies",   icon: FileText },
];

const adminNav: NavItem[] = [
  { href: "/admin",                label: "Overview",      icon: ShieldCheck,   permission: PERMISSIONS.ADMIN_VIEW },
  { href: "/admin/users",          label: "Users",         icon: Users,         permission: PERMISSIONS.ADMIN_USERS },
  { href: "/admin/roles",          label: "Roles & Perms", icon: KeyRound,      permission: PERMISSIONS.ADMIN_ROLES },
  { href: "/admin/sso",            label: "SSO Config",    icon: Link2,         permission: PERMISSIONS.ADMIN_SSO },
  { href: "/admin/notifications",  label: "Notifications", icon: Bell,          permission: PERMISSIONS.ADMIN_NOTIFICATIONS },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const visibleAdminNav = adminNav.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/60 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">CVA Policies</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">IT Platform</div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {/* Admin Section */}
        {visibleAdminNav.length > 0 && (
          <>
            <div className="px-3 pt-5 pb-1">
              <div className="flex items-center gap-2">
                <Settings className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Administration
                </span>
              </div>
            </div>
            {visibleAdminNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-slate-700/60 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-1">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {session?.user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="truncate text-[11px] text-slate-400">
              {session?.user?.roles?.join(", ") ?? "No role"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {active && <ChevronRight className="h-3 w-3 opacity-60" />}
    </Link>
  );
}
