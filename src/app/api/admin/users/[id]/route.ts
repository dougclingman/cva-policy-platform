import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.ADMIN_USERS);
  if (error) return error;

  // Prevent self-deactivation
  if (params.id === session!.user.id) {
    return NextResponse.json({ error: "You cannot modify your own account here" }, { status: 400 });
  }

  try {
    const body = await req.json();

    if (body.isActive !== undefined) {
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: body.isActive },
      });
    }

    if (body.name !== undefined || body.roleIds !== undefined) {
      await prisma.$transaction(async (tx) => {
        if (body.name) {
          await tx.user.update({ where: { id: params.id }, data: { name: body.name.trim() } });
        }
        if (Array.isArray(body.roleIds)) {
          await tx.userRole.deleteMany({ where: { userId: params.id } });
          if (body.roleIds.length > 0) {
            await tx.userRole.createMany({
              data: body.roleIds.map((roleId: string) => ({ userId: params.id, roleId })),
            });
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.ADMIN_USERS);
  if (error) return error;

  if (params.id === session!.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
