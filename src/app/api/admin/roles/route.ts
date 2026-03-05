import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_ROLES);
  if (error) return error;

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { userRoles: true } },
    },
  });

  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_ROLES);
  if (error) return error;

  const { name, description, permissionIds } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Role name is required" }, { status: 400 });
  }

  const role = await prisma.role.create({
    data: {
      name:        name.trim(),
      description: description?.trim() || null,
      isSystem:    false,
      rolePermissions: permissionIds?.length
        ? { create: permissionIds.map((id: string) => ({ permissionId: id })) }
        : undefined,
    },
  });

  return NextResponse.json(role, { status: 201 });
}
