import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canManage = hasPermission(session.user.permissions, PERMISSIONS.REPORTS_MANAGE);

  if (canManage) {
    // Return all reports with user and team info
    const reports = await prisma.staffReport.findMany({
      orderBy: { periodStart: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(reports);
  }

  // Return only current user's reports
  const reports = await prisma.staffReport.findMany({
    where: { userId: session.user.id },
    orderBy: { periodStart: "desc" },
    include: {
      team: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(session.user.permissions, PERMISSIONS.REPORTS_SUBMIT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const {
      periodStart,
      periodEnd,
      accomplishments,
      priorities,
      blockers,
      teamId,
    } = await req.json();

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: "Period start and end are required" }, { status: 400 });
    }

    const report = await prisma.staffReport.create({
      data: {
        userId:         session.user.id,
        teamId:         teamId || null,
        periodStart:    new Date(periodStart),
        periodEnd:      new Date(periodEnd),
        accomplishments: accomplishments || null,
        priorities:     priorities || null,
        blockers:       blockers || null,
        status:         "DRAFT",
      },
      include: {
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
