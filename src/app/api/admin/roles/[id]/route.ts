import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_ROLES);
  if (error) return error;

  const { permissionIds, name, description } = await req.json();

  await prisma.$transaction(async (tx) => {
    if (name !== undefined || description !== undefined) {
      await tx.role.update({
        where: { id: params.id },
        data: {
          name:        name?.trim(),
          description: description?.trim() || null,
        },
      });
    }

    if (Array.isArray(permissionIds)) {
      await tx.rolePermission.deleteMany({ where: { roleId: params.id } });
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: params.id,
            permissionId,
          })),
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_ROLES);
  if (error) return error;

  const role = await prisma.role.findUnique({ where: { id: params.id } });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role.isSystem) return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });

  await prisma.role.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
