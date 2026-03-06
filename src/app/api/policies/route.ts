import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  const canSeeAll = session!.user.permissions.includes(PERMISSIONS.POLICIES_CREATE);

  const policies = await prisma.policy.findMany({
    where: canSeeAll ? {} : { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(policies);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_CREATE);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, summary, content, category, status, tagIds,
            reviewFrequency, nextReviewDate, reviewReminderDays } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    let slug = slugify(title);
    const existing = await prisma.policy.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const policy = await prisma.policy.create({
      data: {
        title:       title.trim(),
        slug,
        summary:     summary?.trim() || null,
        content:     content.trim(),
        category:    category || null,
        status:      status ?? "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        reviewFrequency:    reviewFrequency ?? "NONE",
        nextReviewDate:     nextReviewDate ? new Date(nextReviewDate) : null,
        reviewReminderDays: reviewReminderDays ?? 30,
        createdById: session!.user.id,
        tags: tagIds?.length
          ? { create: tagIds.map((id: string) => ({ tagId: id })) }
          : undefined,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
