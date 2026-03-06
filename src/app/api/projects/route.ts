import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissions ?? [];
  const userId = session.user.id;

  const isManager =
    hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE) ||
    hasPermission(permissions, PERMISSIONS.ADMIN_VIEW);

  const userTeamIds = (
    await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } })
  ).map((t) => t.teamId);

  const where = isManager
    ? {}
    : {
        OR: [
          { teamId: { in: userTeamIds } },
          { members: { some: { userId } } },
        ],
      };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      team: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: {
        select: {
          members: true,
          tasks: true,
        },
      },
      tasks: {
        select: { status: true },
      },
    },
  });

  const result = projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    teamId: p.teamId,
    team: p.team,
    createdById: p.createdById,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    memberCount: p._count.members,
    taskCount: p._count.tasks,
    completedTaskCount: p.tasks.filter((t) => t.status === "COMPLETED").length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissions ?? [];
  if (!hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, status, startDate, endDate, teamId, memberIds } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status ?? "PLANNING",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        teamId: teamId || null,
        createdById: session.user.id,
      },
    });

    // Auto-add creator as Project Manager
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.user.id,
        role: "Project Manager",
      },
    });

    // Add additional members
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const otherMembers = memberIds.filter((id: string) => id !== session.user.id);
      if (otherMembers.length > 0) {
        await prisma.projectMember.createMany({
          data: otherMembers.map((userId: string) => ({
            projectId: project.id,
            userId,
            role: "Member",
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
