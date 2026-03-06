import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.onCallEntry.findMany({
    orderBy: { startDate: "asc" },
    include: {
      user:      { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(PERMISSIONS.ONCALL_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { userId, startDate, endDate, phoneOverride, notes } = body;

    if (!userId)    return NextResponse.json({ error: "User is required" },       { status: 400 });
    if (!startDate) return NextResponse.json({ error: "Start date is required" }, { status: 400 });
    if (!endDate)   return NextResponse.json({ error: "End date is required" },   { status: 400 });

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (end < start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const entry = await prisma.onCallEntry.create({
      data: {
        userId,
        startDate:     start,
        endDate:       end,
        phoneOverride: phoneOverride?.trim() || null,
        notes:         notes?.trim()         || null,
        createdById:   session!.user.id,
      },
      include: {
        user:      { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create on-call entry" }, { status: 500 });
  }
}
