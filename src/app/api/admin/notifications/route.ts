import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_NOTIFICATIONS);
  if (error) return error;

  const config = await prisma.emailConfig.findFirst({
    include: { notifications: { orderBy: { trigger: "asc" } } },
  });

  return NextResponse.json(config ?? {});
}

export async function PUT(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_NOTIFICATIONS);
  if (error) return error;

  const { isEnabled, smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, fromName, notifications } =
    await req.json();

  const existing = await prisma.emailConfig.findFirst();

  const configData: Record<string, unknown> = {
    isEnabled: isEnabled ?? false,
    smtpHost:  smtpHost?.trim()  || null,
    smtpPort:  smtpPort          || null,
    smtpUser:  smtpUser?.trim()  || null,
    fromEmail: fromEmail?.trim() || null,
    fromName:  fromName?.trim()  || null,
  };
  // Only update password if provided
  if (smtpPass?.trim()) configData.smtpPass = smtpPass.trim();

  const config = existing
    ? await prisma.emailConfig.update({ where: { id: existing.id }, data: configData })
    : await prisma.emailConfig.create({ data: configData as Parameters<typeof prisma.emailConfig.create>[0]["data"] });

  // Update individual notification toggles
  if (Array.isArray(notifications)) {
    for (const n of notifications) {
      await prisma.emailNotification.update({
        where: { id: n.id },
        data:  { isEnabled: n.isEnabled },
      });
    }
  }

  return NextResponse.json(config);
}
