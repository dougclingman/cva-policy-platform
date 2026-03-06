import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const existing = await prisma.quickLink.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { title, url, description, icon, displayOrder, isActive } = await req.json();

  const link = await prisma.quickLink.update({
    where: { id: params.id },
    data: {
      ...(title      !== undefined && { title:        title.trim() }),
      ...(url        !== undefined && { url:          url.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(icon       !== undefined && { icon:         icon?.trim() || null }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
      ...(isActive   !== undefined && { isActive:     Boolean(isActive) }),
    },
  });

  return NextResponse.json(link);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const existing = await prisma.quickLink.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.quickLink.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
