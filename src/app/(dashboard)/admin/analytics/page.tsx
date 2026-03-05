import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, Eye, TrendingUp, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  if (!hasPermission(permissions, PERMISSIONS.ADMIN_VIEW)) redirect("/dashboard");

  // Most accessed policies
  const viewCounts = await prisma.policyView.groupBy({
    by: ["policyId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const policyIds = viewCounts.map((v) => v.policyId);

  const policies = await prisma.policy.findMany({
    where: { id: { in: policyIds } },
    select: { id: true, title: true, status: true, updatedAt: true },
  });

  const policyMap = Object.fromEntries(policies.map((p) => [p.id, p]));

  const mostAccessed = viewCounts.map((v) => ({
    policy:    policyMap[v.policyId],
    viewCount: v._count.id,
  })).filter((item) => item.policy);

  // Recent comments (last 20)
  const recentComments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user:   { select: { name: true } },
      policy: { select: { id: true, title: true } },
    },
  });

  // Summary stats
  const [totalViews, totalComments] = await Promise.all([
    prisma.policyView.count(),
    prisma.comment.count(),
  ]);

  return (
    <div>
      <Header
        title="Analytics"
        subtitle="Most accessed policies and viewer comments"
      />

      {/* Back link */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalViews.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Total Policy Views</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="rounded-xl bg-green-50 p-3 text-green-600">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalComments.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Total Comments</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Accessed Policies */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Most Accessed Policies</h2>
          </div>
          {mostAccessed.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              No views recorded yet.
            </div>
          ) : (
            <ol className="divide-y divide-gray-50">
              {mostAccessed.map((item, index) => (
                <li key={item.policy.id} className="px-6 py-3 flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-300 w-5 shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/policies/${item.policy.id}`}
                      className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block"
                    >
                      {item.policy.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {item.policy.status} · Updated {formatDate(item.policy.updatedAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2.5 py-1 shrink-0">
                    <Eye className="h-3 w-3" />
                    {item.viewCount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Recent Comments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-slate-900">Recent Comments</h2>
          </div>
          {recentComments.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              No comments yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentComments.map((comment) => (
                <li key={comment.id} className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">{comment.user.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{comment.content}</p>
                  <Link
                    href={`/policies/${comment.policy.id}`}
                    className="text-xs text-blue-500 hover:underline mt-1 inline-block truncate max-w-full"
                  >
                    {comment.policy.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
