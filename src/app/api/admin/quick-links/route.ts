import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const links = await prisma.quickLink.findMany({
    orderBy: { displayOrder: "asc" },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const { title, url, description, icon, displayOrder, isActive } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!url?.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const link = await prisma.quickLink.create({
    data: {
      title:        title.trim(),
      url:          url.trim(),
      description:  description?.trim() || null,
      icon:         icon?.trim() || null,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      isActive:     isActive !== undefined ? Boolean(isActive) : true,
      createdById:  session!.user.id,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
