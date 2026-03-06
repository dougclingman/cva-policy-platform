import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";

export const metadata = { title: "Runbook Library" };

export default async function RunbooksPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.RUNBOOKS_READ)) {
    redirect("/dashboard");
  }

  const canManage = hasPermission(permissions, PERMISSIONS.RUNBOOKS_MANAGE);

  const runbooks = await prisma.runbook.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  });

  return (
    <div>
      <Header
        title="Runbook Library"
        subtitle={`${runbooks.length} runbook${runbooks.length === 1 ? "" : "s"}`}
        actions={
          canManage ? (
            <Link
              href="/runbooks/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Runbook
            </Link>
          ) : undefined
        }
      />

      {runbooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20">
          <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No runbooks yet</p>
          {canManage && (
            <p className="text-xs text-slate-400 mt-1">
              Create your first runbook to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {runbooks.map((runbook) => (
            <div
              key={runbook.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
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
                  <h3 className="font-semibold text-slate-900 leading-snug">{runbook.title}</h3>
                </div>
              </div>

              {/* Summary */}
              {runbook.summary && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{runbook.summary}</p>
              )}

              {/* Tags */}
              {runbook.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {runbook.tags.map((rt) => (
                    <span
                      key={rt.tagId}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {rt.tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-slate-400">
                  Updated {formatDate(runbook.updatedAt)}
                </span>
                <Link
                  href={`/runbooks/${runbook.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
