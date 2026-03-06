import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json(team);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(PERMISSIONS.REPORTS_MANAGE);
  if (error) return error;

  try {
    const { name, description, leadId, memberIds = [], reportsEnabled } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }
    if (!leadId) {
      return NextResponse.json({ error: "Team lead is required" }, { status: 400 });
    }

    // Ensure lead is always included in members
    const allMemberIds = Array.from(new Set([leadId, ...memberIds]));

    const team = await prisma.$transaction(async (tx) => {
      // Delete all existing members and re-create
      await tx.teamMember.deleteMany({ where: { teamId: params.id } });

      return tx.team.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          leadId,
          ...(reportsEnabled !== undefined && { reportsEnabled: Boolean(reportsEnabled) }),
          members: {
            create: allMemberIds.map((userId: string) => ({ userId })),
          },
        },
        include: {
          lead: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true } },
        },
      });
    });

    return NextResponse.json(team);
  } catch (err: unknown) {
    console.error(err);
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A team with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(PERMISSIONS.REPORTS_MANAGE);
  if (error) return error;

  try {
    await prisma.team.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
