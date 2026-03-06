import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/Badge";
import { AnnouncementActions } from "@/components/announcements/AnnouncementActions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Clock, Pencil, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: announcement?.title ?? "Announcement" };
}

function priorityVariant(priority: string) {
  if (priority === "CRITICAL") return "danger" as const;
  if (priority === "WARNING")  return "warning" as const;
  return "default" as const;
}

function priorityLabel(priority: string) {
  const map: Record<string, string> = { INFO: "Info", WARNING: "Warning", CRITICAL: "Critical" };
  return map[priority] ?? priority;
}

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "published" as const;
  if (status === "ARCHIVED")  return "archived" as const;
  return "draft" as const;
}

function statusLabel(status: string) {
  const map: Record<string, string> = { DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived" };
  return map[status] ?? status;
}

export default async function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
    redirect("/dashboard");
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { dismissals: true } },
    },
  });

  if (!announcement) notFound();

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/announcements" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Announcements
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 truncate">{announcement.title}</span>
      </div>

      <div className="flex gap-6 items-start">
        {/* Main content — 2/3 */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge variant={priorityVariant(announcement.priority)}>
                {priorityLabel(announcement.priority)}
              </Badge>
              <Badge variant={statusVariant(announcement.status)}>
                {statusLabel(announcement.status)}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">{announcement.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Created by {announcement.createdBy.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Updated {formatDate(announcement.updatedAt)}
              </span>
              {announcement.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Published {formatDate(announcement.publishedAt)}
                </span>
              )}
              {announcement.expiresAt && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Expires {formatDate(announcement.expiresAt)}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <article className="prose prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{announcement.body}</ReactMarkdown>
            </article>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Status</h2>
            <div className="mb-4">
              <Badge variant={statusVariant(announcement.status)}>
                {statusLabel(announcement.status)}
              </Badge>
            </div>

            <AnnouncementActions
              announcementId={announcement.id}
              status={announcement.status}
            />

            <div className="mt-3 border-t border-gray-100 pt-3">
              <Link
                href={`/announcements/${announcement.id}/edit`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </div>
          </div>

          {/* Stats */}
          {announcement.status === "PUBLISHED" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Engagement</h2>
              <div className="text-2xl font-bold text-slate-900">{announcement._count.dismissals}</div>
              <div className="text-xs text-slate-500 mt-0.5">user{announcement._count.dismissals !== 1 ? "s" : ""} dismissed</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
