import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge, policyStatusVariant, policyStatusLabel } from "@/components/ui/Badge";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, User, Tag, Archive } from "lucide-react";
import { PolicyReviewActions } from "@/components/policies/PolicyReviewActions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const policy = await prisma.policy.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: policy?.title ?? "Policy" };
}

export default async function PolicyDetailPage({ params }: { params: { id: string } }) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];

  const policy = await prisma.policy.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      updatedBy: { select: { name: true } },
      tags:      { include: { tag: true } },
      reviews:   { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!policy) notFound();

  // Viewers can only see published policies
  const canSeeAll = hasPermission(permissions, PERMISSIONS.POLICIES_CREATE);
  if (!canSeeAll && policy.status !== "PUBLISHED") notFound();

  const canEdit    = hasPermission(permissions, PERMISSIONS.POLICIES_UPDATE);
  const canReview  = hasPermission(permissions, PERMISSIONS.POLICIES_REVIEW) && policy.status === "UNDER_REVIEW";
  const canPublish = hasPermission(permissions, PERMISSIONS.POLICIES_PUBLISH);

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/policies" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Policies
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 truncate">{policy.title}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={policyStatusVariant(policy.status)}>
                  {policyStatusLabel(policy.status)}
                </Badge>
                {policy.category && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {policy.category}
                  </span>
                )}
                <span className="text-xs text-slate-400">v{policy.version}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{policy.title}</h1>
              {policy.summary && (
                <p className="mt-2 text-slate-600">{policy.summary}</p>
              )}
            </div>
            {(canEdit || canPublish) && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {canEdit && (
                  <Link
                    href={`/policies/${policy.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Created by {policy.createdBy.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Updated {formatDate(policy.updatedAt)}
            </span>
            {policy.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Archive className="h-3.5 w-3.5" />
                Published {formatDate(policy.publishedAt)}
              </span>
            )}
            {policy.tags.length > 0 && (
              <span className="flex items-center gap-1.5 flex-wrap">
                <Tag className="h-3.5 w-3.5" />
                {policy.tags.map((pt) => (
                  <span key={pt.tag.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-slate-600">
                    {pt.tag.name}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Review / Publish Actions */}
        {(canReview || canPublish) && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <PolicyReviewActions
              policyId={policy.id}
              status={policy.status}
              canReview={canReview}
              canPublish={canPublish}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <article className="prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{policy.content}</ReactMarkdown>
        </article>
      </div>

      {/* Review History */}
      {policy.reviews.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-slate-900">Review History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {policy.reviews.map((review) => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-slate-700">{review.reviewer.name}</span>
                  <Badge variant={review.status === "APPROVED" ? "success" : review.status === "REJECTED" ? "danger" : "warning"}>
                    {review.status}
                  </Badge>
                  <span className="text-xs text-slate-400 ml-auto">{formatDate(review.createdAt)}</span>
                </div>
                {review.comments && (
                  <p className="text-sm text-slate-600">{review.comments}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
