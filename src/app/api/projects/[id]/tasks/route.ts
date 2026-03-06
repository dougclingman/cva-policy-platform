import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tasks = await prisma.projectTask.findMany({
    where: { projectId: params.id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      dependsOn: {
        include: {
          dependencyTask: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissions ?? [];
  const userId = session.user.id;
  const isManager = hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE);

  // Check if project exists
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Must be manager or project member
  if (!isManager) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.id, userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      status,
      priority,
      startDate,
      endDate,
      assigneeId,
      reminderDays,
      dependencyTaskIds,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId: params.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: status ?? "TODO",
        priority: priority ?? "MEDIUM",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        assigneeId: assigneeId || null,
        reminderDays: reminderDays ?? 1,
        createdById: userId,
      },
    });

    // Create task dependencies
    if (Array.isArray(dependencyTaskIds) && dependencyTaskIds.length > 0) {
      await prisma.taskDependency.createMany({
        data: dependencyTaskIds.map((dependencyTaskId: string) => ({
          dependentTaskId: task.id,
          dependencyTaskId,
        })),
        skipDuplicates: true,
      });
    }

    const taskWithDetails = await prisma.projectTask.findUnique({
      where: { id: task.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        dependsOn: {
          include: {
            dependencyTask: { select: { id: true, title: true } },
          },
        },
      },
    });

    return NextResponse.json(taskWithDetails, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
