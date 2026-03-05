import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Badge, policyStatusVariant, policyStatusLabel } from "@/components/ui/Badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { PoliciesFilters } from "@/components/policies/PoliciesFilters";
import { FileText, Plus } from "lucide-react";

export const metadata = { title: "Policies" };

interface SearchParams {
  q?: string;
  status?: string;
  category?: string;
  tag?: string;
}

async function getPolicies(params: SearchParams, userPermissions: string[]) {
  const canSeeAll = hasPermission(userPermissions, PERMISSIONS.POLICIES_CREATE);

  const where: Record<string, unknown> = {};

  // Viewers can only see published policies
  if (!canSeeAll) {
    where.status = "PUBLISHED";
  } else if (params.status) {
    where.status = params.status;
  }

  if (params.q) {
    where.OR = [
      { title:    { contains: params.q, mode: "insensitive" } },
      { summary:  { contains: params.q, mode: "insensitive" } },
      { category: { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (params.category) where.category = params.category;

  if (params.tag) {
    where.tags = { some: { tag: { name: params.tag } } };
  }

  const [policies, categories, tags] = await Promise.all([
    prisma.policy.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        tags: { include: { tag: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.policy.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { policies, categories: categories.map((c) => c.category!).filter(Boolean), tags };
}

export default async function PoliciesPage({ searchParams }: { searchParams: SearchParams }) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];
  const canCreate   = hasPermission(permissions, PERMISSIONS.POLICIES_CREATE);

  const { policies, categories, tags } = await getPolicies(searchParams, permissions);

  return (
    <div>
      <Header
        title="IT Policies"
        subtitle={`${policies.length} polic${policies.length === 1 ? "y" : "ies"} found`}
        actions={
          canCreate ? (
            <Link
              href="/policies/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Policy
            </Link>
          ) : undefined
        }
      />

      <PoliciesFilters
        categories={categories}
        tags={tags.map((t) => t.name)}
        canFilterStatus={canCreate}
        currentFilters={searchParams}
      />

      {/* Policy List */}
      <div className="mt-4 space-y-3">
        {policies.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No policies found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
        {policies.map((policy) => (
          <Link
            key={policy.id}
            href={`/policies/${policy.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-slate-900 truncate">{policy.title}</h3>
                  <Badge variant={policyStatusVariant(policy.status)}>
                    {policyStatusLabel(policy.status)}
                  </Badge>
                </div>
                {policy.summary && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-2">{policy.summary}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                  {policy.category && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
                      {policy.category}
                    </span>
                  )}
                  {policy.tags.map((pt) => (
                    <span key={pt.tag.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-slate-600">
                      {pt.tag.name}
                    </span>
                  ))}
                  <span className="text-slate-300">•</span>
                  <span>Updated {formatDate(policy.updatedAt)}</span>
                  <span>by {policy.createdBy.name}</span>
                  {policy._count.reviews > 0 && (
                    <span>{policy._count.reviews} review{policy._count.reviews !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0 text-right">
                <div>v{policy.version}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
