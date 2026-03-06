import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.RUNBOOKS_READ);
  if (error) return error;

  const runbooks = await prisma.runbook.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(runbooks);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(PERMISSIONS.RUNBOOKS_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, summary, content, category, tagIds } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(title.trim());
    const existing = await prisma.runbook.findUnique({ where: { slug } });
    if (existing) {
      let counter = 1;
      while (true) {
        const candidate = `${slug}-${counter}`;
        const conflict = await prisma.runbook.findUnique({ where: { slug: candidate } });
        if (!conflict) { slug = candidate; break; }
        counter++;
      }
    }

    const runbook = await prisma.runbook.create({
      data: {
        title:      title.trim(),
        slug,
        summary:    summary?.trim() || null,
        content:    content.trim(),
        category:   category?.trim() || null,
        createdById: session!.user.id,
        tags: tagIds?.length
          ? { create: tagIds.map((id: string) => ({ tagId: id })) }
          : undefined,
      },
    });

    return NextResponse.json(runbook, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
