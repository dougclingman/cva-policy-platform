import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge, policyStatusVariant, policyStatusLabel } from "@/components/ui/Badge";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, User, Tag, Archive, CalendarClock, CheckCircle2, Bell } from "lucide-react";
import { PolicyReviewActions } from "@/components/policies/PolicyReviewActions";
import { CommentsSection } from "@/components/policies/CommentsSection";
import { AcknowledgmentSection } from "@/components/policies/AcknowledgmentSection";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const policy = await prisma.policy.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: policy?.title ?? "Policy" };
}

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  SEMI_ANNUAL: "Semi-Annual",
  ANNUAL: "Annual",
};

export default async function PolicyDetailPage({ params }: { params: { id: string } }) {
  const session     = await getServerSession(authOptions);
  const permissions = session?.user?.permissions ?? [];
  const userId      = session?.user?.id ?? "";

  const policy = await prisma.policy.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      updatedBy: { select: { name: true } },
      tags:      { include: { tag: true } },
      reviews:   { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      comments:  { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!policy) notFound();

  // Viewers can only see published policies
  const canSeeAll = hasPermission(permissions, PERMISSIONS.POLICIES_CREATE);
  if (!canSeeAll && policy.status !== "PUBLISHED") notFound();

  // Track view
  if (session?.user?.id) {
    prisma.policyView.create({ data: { policyId: policy.id, userId: session.user.id } }).catch(() => {});
  }

  const canEdit    = hasPermission(permissions, PERMISSIONS.POLICIES_UPDATE);
  const canReview  = hasPermission(permissions, PERMISSIONS.POLICIES_REVIEW) && policy.status === "UNDER_REVIEW";
  const canPublish = hasPermission(permissions, PERMISSIONS.POLICIES_PUBLISH);

  // Acknowledgment data
  let myAck = null;
  let ackSummary = null;
  if (policy.acknowledgmentRequired && userId) {
    myAck = await prisma.policyAcknowledgment.findUnique({
      where: { policyId_userId: { policyId: policy.id, userId } },
    });
    if (canPublish) {
      const [totalUsers, acknowledged] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.policyAcknowledgment.count({ where: { policyId: policy.id } }),
      ]);
      ackSummary = { totalUsers, acknowledged };
    }
  }

  const isReviewDue = policy.nextReviewDate && policy.reviewFrequency !== "NONE"
    && policy.nextReviewDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

      {/* Acknowledgment banner (for users who haven't acknowledged) */}
      {policy.acknowledgmentRequired && policy.status === "PUBLISHED" && !myAck && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Bell className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1 text-sm text-blue-800">
            <span className="font-semibold">Action required:</span> This policy requires your acknowledgment.
            {policy.acknowledgmentDeadline && (
              <span className="ml-1">Deadline: <strong>{formatDate(policy.acknowledgmentDeadline)}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Already acknowledged banner */}
      {policy.acknowledgmentRequired && myAck && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            You acknowledged this policy on <strong>{formatDate(myAck.acknowledgedAt)}</strong>.
          </p>
        </div>
      )}

      {/* Review due banner (admin/managers) */}
      {canSeeAll && isReviewDue && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <CalendarClock className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            This policy is due for its <strong>{FREQUENCY_LABELS[policy.reviewFrequency] ?? policy.reviewFrequency}</strong> review
            {policy.nextReviewDate && (
              <> by <strong>{formatDate(policy.nextReviewDate)}</strong></>
            )}.
          </p>
        </div>
      )}

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
            {policy.reviewFrequency !== "NONE" && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                {FREQUENCY_LABELS[policy.reviewFrequency]} review
                {policy.nextReviewDate && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ml-1 ${
                    policy.nextReviewDate < new Date()
                      ? "bg-red-100 text-red-700"
                      : policy.nextReviewDate <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-slate-600"
                  }`}>
                    Due {formatDate(policy.nextReviewDate)}
                  </span>
                )}
                {policy.lastReviewedAt && (
                  <span className="text-xs text-slate-400 ml-1">· Last reviewed {formatDate(policy.lastReviewedAt)}</span>
                )}
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

          {/* Acknowledgment progress (admin) */}
          {ackSummary && (
            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">Acknowledgment Progress</span>
                <span className="text-sm text-slate-600">{ackSummary.acknowledged} / {ackSummary.totalUsers} users</span>
              </div>
              <div className="w-full rounded-full bg-slate-200 h-2">
                <div
                  className="rounded-full bg-green-500 h-2 transition-all"
                  style={{ width: `${ackSummary.totalUsers > 0 ? Math.round((ackSummary.acknowledged / ackSummary.totalUsers) * 100) : 0}%` }}
                />
              </div>
              <Link href="/admin/acknowledgments" className="mt-1.5 inline-block text-xs text-blue-600 hover:underline">
                View full acknowledgment report →
              </Link>
            </div>
          )}
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

      {/* Acknowledgment Section */}
      {policy.acknowledgmentRequired && policy.status === "PUBLISHED" && userId && (
        <AcknowledgmentSection
          policyId={policy.id}
          alreadyAcknowledged={!!myAck}
          acknowledgedAt={myAck?.acknowledgedAt?.toISOString() ?? null}
          canRequestAcknowledgment={canPublish}
          acknowledgmentDeadline={policy.acknowledgmentDeadline?.toISOString() ?? null}
        />
      )}

      {/* Push for Acknowledgment (admin, published, not yet required) */}
      {canPublish && policy.status === "PUBLISHED" && !policy.acknowledgmentRequired && (
        <AcknowledgmentSection
          policyId={policy.id}
          alreadyAcknowledged={false}
          acknowledgedAt={null}
          canRequestAcknowledgment={true}
          acknowledgmentDeadline={null}
          showRequestOnly={true}
        />
      )}

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

      {/* Comments */}
      {policy.status === "PUBLISHED" && (
        <CommentsSection
          policyId={policy.id}
          initialComments={policy.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          }))}
          currentUserName={session?.user?.name ?? null}
        />
      )}
    </div>
  );
}
