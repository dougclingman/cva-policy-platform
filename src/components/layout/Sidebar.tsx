"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, ShieldCheck, Users, KeyRound,
  Link2, Bell, LogOut, ChevronRight, Settings, ClipboardCheck, Plane, Wrench,
  Megaphone, PhoneCall, BookOpen, ClipboardList, MessageSquare, Plug, Users2,
  ExternalLink, FolderKanban, Palette, Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
}

interface BrandingProp {
  platformName: string;
  logoUrl: string | null;
}

interface SidebarProps {
  branding?: BrandingProp;
}

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/policies",  label: "Policies",  icon: FileText },
];

// Team tools — visible to users with the relevant permission (no permission = visible to all logged-in users)
const toolsNav: NavItem[] = [
  { href: "/travel",         label: "Travel Exceptions", icon: Plane,          permission: PERMISSIONS.TRAVEL_MANAGE },
  { href: "/announcements",  label: "IT Announcements",  icon: Megaphone,      permission: PERMISSIONS.ANNOUNCEMENTS_MANAGE },
  { href: "/oncall",         label: "On-Call Schedule",  icon: PhoneCall,      permission: PERMISSIONS.ONCALL_MANAGE },
  { href: "/runbooks",       label: "Runbooks",          icon: BookOpen,       permission: PERMISSIONS.RUNBOOKS_READ },
  { href: "/reports",        label: "Status Reports",    icon: ClipboardList },
  { href: "/projects",       label: "Projects",          icon: FolderKanban,   permission: PERMISSIONS.PROJECTS_READ },
  { href: "/chat",           label: "IT Chat",           icon: MessageSquare },
  { href: "/network",        label: "Network Status",    icon: Network },
];

const adminNav: NavItem[] = [
  { href: "/admin",                 label: "Overview",        icon: ShieldCheck,    permission: PERMISSIONS.ADMIN_VIEW },
  { href: "/admin/users",           label: "Users",           icon: Users,          permission: PERMISSIONS.ADMIN_USERS },
  { href: "/admin/roles",           label: "Roles & Perms",   icon: KeyRound,       permission: PERMISSIONS.ADMIN_ROLES },
  { href: "/admin/acknowledgments", label: "Acknowledgments", icon: ClipboardCheck, permission: PERMISSIONS.ADMIN_VIEW },
  { href: "/admin/teams",           label: "Teams & Reports", icon: Users2,         permission: PERMISSIONS.REPORTS_MANAGE },
  { href: "/admin/sso",             label: "SSO Config",      icon: Link2,          permission: PERMISSIONS.ADMIN_SSO },
  { href: "/admin/notifications",   label: "Notifications",   icon: Bell,           permission: PERMISSIONS.ADMIN_NOTIFICATIONS },
  { href: "/admin/integrations",    label: "Integrations",    icon: Plug,           permission: PERMISSIONS.ADMIN_VIEW },
  { href: "/admin/quick-links",     label: "Quick Links",     icon: ExternalLink,   permission: PERMISSIONS.ADMIN_VIEW },
  { href: "/admin/branding",        label: "Branding",        icon: Palette,        permission: PERMISSIONS.ADMIN_VIEW },
];

export function Sidebar({ branding }: SidebarProps) {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const visibleToolsNav = toolsNav.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );
  const visibleAdminNav = adminNav.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  const platformName = branding?.platformName ?? "Yield";
  const logoUrl      = branding?.logoUrl      ?? null;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/60 px-6">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={platformName}
              className="h-8 w-8 rounded-lg object-contain"
            />
          ) : (
            <ShieldCheck className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-sm font-bold text-white truncate">{platformName}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">IT Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {/* Team Tools Section */}
        {visibleToolsNav.length > 0 && (
          <>
            <div className="px-3 pt-5 pb-1">
              <div className="flex items-center gap-2">
                <Wrench className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Team Tools
                </span>
              </div>
            </div>
            {visibleToolsNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </>
        )}

        {/* Administration Section */}
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
