import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  if (error) return error;

  const announcements = await prisma.announcement.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { dismissals: true } },
    },
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, body: bodyText, priority, expiresAt } = body;

    if (!title?.trim() || !bodyText?.trim()) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title:      title.trim(),
        body:       bodyText.trim(),
        priority:   priority ?? "INFO",
        expiresAt:  expiresAt ? new Date(expiresAt) : null,
        createdById: session!.user.id,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
