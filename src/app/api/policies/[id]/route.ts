import { NextRequest, NextResponse } from "next/server";
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
    const { title, summary, content, category, status, tagIds } = body;

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
  const session = await import("next-auth").then((m) => m.getServerSession(await import("@/lib/auth").then((a) => a.authOptions)));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, comment } = await req.json();
  const permissions = session.user.permissions;

  const policy = await prisma.policy.findUnique({ where: { id: params.id } });
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transitions: Record<string, { requiredPerm: string; nextStatus: string; createReview?: boolean; reviewStatus?: string }> = {
    submit_review: { requiredPerm: PERMISSIONS.POLICIES_PUBLISH, nextStatus: "UNDER_REVIEW" },
    approve:       { requiredPerm: PERMISSIONS.POLICIES_REVIEW,  nextStatus: "UNDER_REVIEW", createReview: true, reviewStatus: "APPROVED" },
    reject:        { requiredPerm: PERMISSIONS.POLICIES_REVIEW,  nextStatus: "DRAFT",        createReview: true, reviewStatus: "REJECTED" },
    publish:       { requiredPerm: PERMISSIONS.POLICIES_PUBLISH, nextStatus: "PUBLISHED" },
    archive:       { requiredPerm: PERMISSIONS.POLICIES_PUBLISH, nextStatus: "ARCHIVED" },
  };

  const transition = transitions[action];
  if (!transition) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (!permissions.includes(transition.requiredPerm)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.policy.update({
      where: { id: params.id },
      data: {
        status:      transition.nextStatus as "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "ARCHIVED",
        publishedAt: transition.nextStatus === "PUBLISHED" ? (policy.publishedAt ?? new Date()) : policy.publishedAt,
        updatedById: session.user.id,
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
