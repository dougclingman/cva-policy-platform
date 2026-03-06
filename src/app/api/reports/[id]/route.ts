import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await prisma.staffReport.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      projectUpdates: {
        include: {
          project: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const canManage = hasPermission(session.user.permissions, PERMISSIONS.REPORTS_MANAGE);
  if (report.userId !== session.user.id && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(report);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(session.user.permissions, PERMISSIONS.REPORTS_SUBMIT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await prisma.staffReport.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, status: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const canManage = hasPermission(session.user.permissions, PERMISSIONS.REPORTS_MANAGE);
  if (report.userId !== session.user.id && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { action, accomplishments, priorities, blockers, teamId, projectUpdates } = await req.json();

    const isSubmit = action === "submit";

    if (isSubmit && report.status === "SUBMITTED") {
      return NextResponse.json({ error: "Report already submitted" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update report fields
      const updatedReport = await tx.staffReport.update({
        where: { id: params.id },
        data: {
          accomplishments: accomplishments ?? undefined,
          priorities:      priorities      ?? undefined,
          blockers:        blockers        ?? undefined,
          teamId:          teamId !== undefined ? (teamId || null) : undefined,
          ...(isSubmit && {
            status:      "SUBMITTED",
            submittedAt: new Date(),
          }),
        },
      });

      // Handle project updates (upsert)
      if (Array.isArray(projectUpdates)) {
        for (const pu of projectUpdates) {
          await tx.staffProjectUpdate.upsert({
            where: { projectId_reportId: { projectId: pu.projectId, reportId: params.id } },
            create: { projectId: pu.projectId, reportId: params.id, progressNote: pu.progressNote },
            update: { progressNote: pu.progressNote },
          });
        }
      }

      return updatedReport;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await prisma.staffReport.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, status: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (report.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft reports can be deleted" }, { status: 400 });
  }

  await prisma.staffReport.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
