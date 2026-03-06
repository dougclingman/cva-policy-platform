import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.RUNBOOKS_READ);
  if (error) return error;

  const runbook = await prisma.runbook.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!runbook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(runbook);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.RUNBOOKS_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, summary, content, category, tagIds } = body;

    const current = await prisma.runbook.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const runbook = await prisma.runbook.update({
      where: { id: params.id },
      data: {
        title:      title?.trim() ?? current.title,
        summary:    summary?.trim() || null,
        content:    content?.trim() ?? current.content,
        category:   category?.trim() || null,
        updatedById: session!.user.id,
        tags: tagIds !== undefined
          ? {
              deleteMany: {},
              create: tagIds.map((id: string) => ({ tagId: id })),
            }
          : undefined,
      },
    });

    return NextResponse.json(runbook);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.RUNBOOKS_MANAGE);
  if (error) return error;

  try {
    const { action } = await req.json();

    const runbook = await prisma.runbook.findUnique({ where: { id: params.id } });
    if (!runbook) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "publish") {
      await prisma.runbook.update({
        where: { id: params.id },
        data: { status: "PUBLISHED", updatedById: session!.user.id },
      });
    } else if (action === "archive") {
      await prisma.runbook.update({
        where: { id: params.id },
        data: { status: "DRAFT", updatedById: session!.user.id },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.RUNBOOKS_MANAGE);
  if (error) return error;

  try {
    await prisma.runbook.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
