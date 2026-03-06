import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.REPORTS_MANAGE);
  if (error) return error;

  try {
    const { name, description, leadId, memberIds = [], reportsEnabled = true } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }
    if (!leadId) {
      return NextResponse.json({ error: "Team lead is required" }, { status: 400 });
    }

    // Ensure lead is always included in members
    const allMemberIds = Array.from(new Set([leadId, ...memberIds]));

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        leadId,
        reportsEnabled: Boolean(reportsEnabled),
        members: {
          create: allMemberIds.map((userId: string) => ({ userId })),
        },
      },
      include: {
        lead: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A team with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
