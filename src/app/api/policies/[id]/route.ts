import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { slugify } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  const policy = await prisma.policy.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
      tags: { include: { tag: true } },
      reviews: { include: { reviewer: { select: { name: true } } } },
    },
  });

  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canSeeAll = session!.user.permissions.includes(PERMISSIONS.POLICIES_CREATE);
  if (!canSeeAll && policy.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(policy);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_UPDATE);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, summary, content, category, status, tagIds,
            reviewFrequency, nextReviewDate, reviewReminderDays } = body;

    const current = await prisma.policy.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Recalculate slug only if title changed
    let slug = current.slug;
    if (title && title.trim() !== current.title) {
      slug = slugify(title.trim());
      const existing = await prisma.policy.findFirst({ where: { slug, NOT: { id: params.id } } });
      if (existing) slug = `${slug}-${Date.now()}`;
    }

    const policy = await prisma.policy.update({
      where: { id: params.id },
      data: {
        title:       title?.trim() ?? current.title,
        slug,
        summary:     summary?.trim() || null,
        content:     content?.trim() ?? current.content,
        category:    category || null,
        status:      status ?? current.status,
        publishedAt: status === "PUBLISHED" && !current.publishedAt ? new Date() : current.publishedAt,
        version:     current.version + 1,
        updatedById: session!.user.id,
        reviewFrequency:    reviewFrequency ?? current.reviewFrequency,
        nextReviewDate:     nextReviewDate !== undefined
          ? (nextReviewDate ? new Date(nextReviewDate) : null)
          : current.nextReviewDate,
        reviewReminderDays: reviewReminderDays ?? current.reviewReminderDays,
        tags: tagIds !== undefined
          ? {
              deleteMany: {},
              create: tagIds.map((id: string) => ({ tagId: id })),
            }
          : undefined,
      },
    });

    return NextResponse.json(policy);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — lifecycle actions (approve, reject, publish, archive, submit_review)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, comment, acknowledgmentDeadline } = await req.json();
  const permissions = session.user.permissions;

  const policy = await prisma.policy.findUnique({ where: { id: params.id } });
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Handle acknowledgment request separately
  if (action === "request_acknowledgment") {
    if (!permissions.includes(PERMISSIONS.POLICIES_PUBLISH)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.policy.update({
      where: { id: params.id },
      data: {
        acknowledgmentRequired: true,
        acknowledgmentDeadline: acknowledgmentDeadline ? new Date(acknowledgmentDeadline) : null,
        updatedById: session.user.id,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "clear_acknowledgment") {
    if (!permissions.includes(PERMISSIONS.POLICIES_PUBLISH)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.policy.update({
      where: { id: params.id },
      data: { acknowledgmentRequired: false, acknowledgmentDeadline: null, updatedById: session.user.id },
    });
    return NextResponse.json({ success: true });
  }

  const transitions: Record<string, { requiredPerm: string; nextStatus: string; createReview?: boolean; reviewStatus?: string; updateReviewedAt?: boolean }> = {
    submit_review: { requiredPerm: PERMISSIONS.POLICIES_PUBLISH, nextStatus: "UNDER_REVIEW" },
    approve:       { requiredPerm: PERMISSIONS.POLICIES_REVIEW,  nextStatus: "UNDER_REVIEW", createReview: true, reviewStatus: "APPROVED", updateReviewedAt: true },
    reject:        { requiredPerm: PERMISSIONS.POLICIES_REVIEW,  nextStatus: "DRAFT",        createReview: true, reviewStatus: "REJECTED" },
    publish:       { requiredPerm: PERMISSIONS.POLICIES_PUBLISH, nextStatus: "PUBLISHED", updateReviewedAt: true },
    archive:       { requiredPerm: PERMISSIONS.POLICIES_PUBLISH, nextStatus: "ARCHIVED" },
  };

  const transition = transitions[action];
  if (!transition) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (!permissions.includes(transition.requiredPerm)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Recalculate next review date if this action marks a review completion
  function calcNextReviewDate(frequency: string): Date | null {
    const now = new Date();
    switch (frequency) {
      case "MONTHLY":     now.setMonth(now.getMonth() + 1); return now;
      case "QUARTERLY":   now.setMonth(now.getMonth() + 3); return now;
      case "SEMI_ANNUAL": now.setMonth(now.getMonth() + 6); return now;
      case "ANNUAL":      now.setFullYear(now.getFullYear() + 1); return now;
      default:            return null;
    }
  }

  await prisma.$transaction(async (tx) => {
    const reviewedAt = transition.updateReviewedAt ? new Date() : policy.lastReviewedAt;
    const nextReview = transition.updateReviewedAt && policy.reviewFrequency !== "NONE"
      ? calcNextReviewDate(policy.reviewFrequency)
      : policy.nextReviewDate;

    await tx.policy.update({
      where: { id: params.id },
      data: {
        status:        transition.nextStatus as "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "ARCHIVED",
        publishedAt:   transition.nextStatus === "PUBLISHED" ? (policy.publishedAt ?? new Date()) : policy.publishedAt,
        updatedById:   session.user.id,
        lastReviewedAt: reviewedAt,
        nextReviewDate: nextReview,
      },
    });

    if (transition.createReview) {
      await tx.policyReview.create({
        data: {
          policyId:   params.id,
          reviewerId: session.user.id,
          status:     transition.reviewStatus!,
          comments:   comment || null,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.POLICIES_DELETE);
  if (error) return error;

  try {
    await prisma.policy.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
