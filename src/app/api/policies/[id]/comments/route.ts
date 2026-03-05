import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  const comments = await prisma.comment.findMany({
    where: { policyId: params.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  try {
    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const policy = await prisma.policy.findUnique({ where: { id: params.id }, select: { status: true } });
    if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (policy.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Comments are only allowed on published policies" }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        policyId: params.id,
        userId:   session!.user.id,
        content:  content.trim(),
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
