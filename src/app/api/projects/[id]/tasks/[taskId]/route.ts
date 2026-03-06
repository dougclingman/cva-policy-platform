import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

interface RouteParams {
  params: { id: string; taskId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.projectTask.findUnique({
    where: { id: params.taskId, projectId: params.id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      dependsOn: {
        include: {
          dependencyTask: { select: { id: true, title: true } },
        },
      },
      dependedOnBy: {
        include: {
          dependentTask: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissions ?? [];
  const userId = session.user.id;
  const isManager = hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE);

  const task = await prisma.projectTask.findUnique({
    where: { id: params.taskId, projectId: params.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

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

    const updated = await prisma.projectTask.update({
      where: { id: params.taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(reminderDays !== undefined && { reminderDays }),
      },
    });

    // Replace all dependencies if provided
    if (Array.isArray(dependencyTaskIds)) {
      await prisma.taskDependency.deleteMany({
        where: { dependentTaskId: params.taskId },
      });
      if (dependencyTaskIds.length > 0) {
        await prisma.taskDependency.createMany({
          data: dependencyTaskIds.map((dependencyTaskId: string) => ({
            dependentTaskId: params.taskId,
            dependencyTaskId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const taskWithDetails = await prisma.projectTask.findUnique({
      where: { id: params.taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        dependsOn: {
          include: {
            dependencyTask: { select: { id: true, title: true } },
          },
        },
      },
    });

    return NextResponse.json(taskWithDetails);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissions ?? [];
  const userId = session.user.id;
  const isManager = hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE);

  const task = await prisma.projectTask.findUnique({
    where: { id: params.taskId, projectId: params.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

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
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const updated = await prisma.projectTask.update({
      where: { id: params.taskId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissions ?? [];
  if (!hasPermission(permissions, PERMISSIONS.PROJECTS_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = await prisma.projectTask.findUnique({
    where: { id: params.taskId, projectId: params.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    await prisma.projectTask.delete({ where: { id: params.taskId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
