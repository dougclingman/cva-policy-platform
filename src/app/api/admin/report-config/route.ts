import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const config = await prisma.reportConfig.findFirst();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.REPORTS_MANAGE);
  if (error) return error;

  try {
    const { interval, dueDayOfWeek, reminderDays, isEnabled } = await req.json();

    const existing = await prisma.reportConfig.findFirst();

    let config;
    if (existing) {
      config = await prisma.reportConfig.update({
        where: { id: existing.id },
        data: {
          ...(interval !== undefined && { interval }),
          ...(dueDayOfWeek !== undefined && { dueDayOfWeek: Number(dueDayOfWeek) }),
          ...(reminderDays !== undefined && { reminderDays: Number(reminderDays) }),
          ...(isEnabled !== undefined && { isEnabled }),
        },
      });
    } else {
      config = await prisma.reportConfig.create({
        data: {
          interval: interval ?? "WEEKLY",
          dueDayOfWeek: dueDayOfWeek !== undefined ? Number(dueDayOfWeek) : 5,
          reminderDays: reminderDays !== undefined ? Number(reminderDays) : 1,
          isEnabled: isEnabled ?? true,
        },
      });
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
