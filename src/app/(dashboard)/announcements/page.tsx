import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, Megaphone, ArrowRight } from "lucide-react";

export const metadata = { title: "IT Announcements" };

function priorityVariant(priority: string) {
  if (priority === "CRITICAL") return "danger" as const;
  if (priority === "WARNING")  return "warning" as const;
  return "default" as const;
}

function priorityLabel(priority: string) {
  const map: Record<string, string> = {
    INFO:     "Info",
    WARNING:  "Warning",
    CRITICAL: "Critical",
  };
  return map[priority] ?? priority;
}

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "published" as const;
  if (status === "ARCHIVED")  return "archived" as const;
  return "draft" as const;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT:     "Draft",
    PUBLISHED: "Published",
    ARCHIVED:  "Archived",
  };
  return map[status] ?? status;
}

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
    redirect("/dashboard");
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { dismissals: true } },
    },
  });

  return (
    <div>
      <Header
        title="IT Announcements"
        subtitle="Manage service bulletins and IT notices for the department"
        actions={
          <Link
            href="/announcements/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </Link>
        }
      />

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <Megaphone className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No announcements yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first announcement to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Expires</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-900 line-clamp-1">{announcement.title}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={priorityVariant(announcement.priority)}>
                      {priorityLabel(announcement.priority)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={statusVariant(announcement.status)}>
                      {statusLabel(announcement.status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {announcement.expiresAt ? formatDate(announcement.expiresAt) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {formatDate(announcement.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/announcements/${announcement.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs"
                    >
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
