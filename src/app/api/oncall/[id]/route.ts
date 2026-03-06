import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requirePermission(PERMISSIONS.ONCALL_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { userId, startDate, endDate, phoneOverride, notes } = body;

    const existing = await prisma.onCallEntry.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const start = startDate ? new Date(startDate) : existing.startDate;
    const end   = endDate   ? new Date(endDate)   : existing.endDate;

    if (end < start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const updated = await prisma.onCallEntry.update({
      where: { id: params.id },
      data: {
        ...(userId    !== undefined && { userId }),
        startDate: start,
        endDate:   end,
        phoneOverride: phoneOverride !== undefined
          ? (phoneOverride?.trim() || null)
          : existing.phoneOverride,
        notes: notes !== undefined
          ? (notes?.trim() || null)
          : existing.notes,
      },
      include: {
        user:      { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update on-call entry" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requirePermission(PERMISSIONS.ONCALL_MANAGE);
  if (error) return error;

  try {
    const existing = await prisma.onCallEntry.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.onCallEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete on-call entry" }, { status: 500 });
  }
}
