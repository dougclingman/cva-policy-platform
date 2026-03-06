import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Clock, Pencil, Tag, User } from "lucide-react";
import { RunbookActions } from "@/components/runbooks/RunbookActions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const runbook = await prisma.runbook.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: runbook?.title ?? "Runbook" };
}

export default async function RunbookDetailPage({ params }: { params: { id: string } }) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.RUNBOOKS_READ)) {
    redirect("/dashboard");
  }

  const canManage = hasPermission(permissions, PERMISSIONS.RUNBOOKS_MANAGE);

  const runbook = await prisma.runbook.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!runbook) notFound();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/runbooks"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Runbooks
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 truncate">{runbook.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: header + content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {runbook.category && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {runbook.category}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      runbook.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {runbook.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{runbook.title}</h1>
                {runbook.summary && (
                  <p className="mt-2 text-slate-600">{runbook.summary}</p>
                )}
              </div>
              {canManage && (
                <Link
                  href={`/runbooks/${runbook.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              )}
            </div>

            {/* Tags */}
            {runbook.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                {runbook.tags.map((rt) => (
                  <span
                    key={rt.tagId}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                  >
                    {rt.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <article className="prose prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{runbook.content}</ReactMarkdown>
            </article>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Info card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Details</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Created by</div>
                  <div className="font-medium text-slate-700">{runbook.createdBy.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Last updated</div>
                  <div className="font-medium text-slate-700">{formatDate(runbook.updatedAt)}</div>
                </div>
              </div>
              {runbook.updatedBy && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Updated by</div>
                    <div className="font-medium text-slate-700">{runbook.updatedBy.name}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Created</div>
                  <div className="font-medium text-slate-700">{formatDate(runbook.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions card (manage only) */}
          {canManage && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Actions</h2>
              <RunbookActions runbookId={runbook.id} status={runbook.status} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
