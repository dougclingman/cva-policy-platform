import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  if (error) return error;

  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { dismissals: true } },
    },
  });

  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(announcement);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { action, title, body: bodyText, priority, expiresAt } = body;

    const current = await prisma.announcement.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let updateData: Record<string, unknown> = {};

    if (action === "publish") {
      updateData = { status: "PUBLISHED", publishedAt: new Date() };
    } else if (action === "archive") {
      updateData = { status: "ARCHIVED" };
    } else {
      // Field update (no action)
      if (title !== undefined)     updateData.title     = title.trim();
      if (bodyText !== undefined)  updateData.body      = bodyText.trim();
      if (priority !== undefined)  updateData.priority  = priority;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(announcement);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  if (error) return error;

  try {
    await prisma.announcement.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
