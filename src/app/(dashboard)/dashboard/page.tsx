import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Badge, policyStatusVariant, policyStatusLabel } from "@/components/ui/Badge";
import { FileText, CheckCircle, Clock, Archive, Users, Eye } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

async function getStats() {
  const [total, published, underReview, draft, archived, userCount, recentPolicies] =
    await Promise.all([
      prisma.policy.count(),
      prisma.policy.count({ where: { status: "PUBLISHED" } }),
      prisma.policy.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.policy.count({ where: { status: "DRAFT" } }),
      prisma.policy.count({ where: { status: "ARCHIVED" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.policy.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { createdBy: { select: { name: true } }, tags: { include: { tag: true } } },
      }),
    ]);
  return { total, published, underReview, draft, archived, userCount, recentPolicies };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats   = await getStats();

  const statCards = [
    { label: "Total Policies",  value: stats.total,       icon: FileText,     color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Published",       value: stats.published,   icon: CheckCircle,  color: "text-green-600",  bg: "bg-green-50" },
    { label: "Under Review",    value: stats.underReview, icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Draft",           value: stats.draft,       icon: Eye,          color: "text-slate-500",  bg: "bg-slate-50" },
    { label: "Archived",        value: stats.archived,    icon: Archive,      color: "text-red-500",    bg: "bg-red-50" },
    { label: "Active Users",    value: stats.userCount,   icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div>
      <Header
        title={`Welcome back, ${session?.user?.name?.split(" ")[0]}`}
        subtitle="Here's an overview of your IT Policy Platform"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`inline-flex rounded-lg p-2 ${card.bg} mb-3`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-slate-900">Recent Policies</h2>
          <Link href="/policies" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentPolicies.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">No policies yet.</div>
          )}
          {stats.recentPolicies.map((policy) => (
            <Link
              key={policy.id}
              href={`/policies/${policy.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{policy.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {policy.category && <span className="mr-2">{policy.category}</span>}
                  Updated {formatDate(policy.updatedAt)} by {policy.createdBy.name}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {policy.tags.slice(0, 2).map((pt) => (
                  <span key={pt.tag.id} className="hidden sm:inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {pt.tag.name}
                  </span>
                ))}
                <Badge variant={policyStatusVariant(policy.status)}>
                  {policyStatusLabel(policy.status)}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
