import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const config = await prisma.teamsConfig.findFirst();
  return NextResponse.json(config ?? {});
}

export async function PUT(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  try {
    const { isEnabled, incomingWebhookUrl, verificationToken, channelName } = await req.json();

    const existing = await prisma.teamsConfig.findFirst();

    const data = {
      isEnabled:          isEnabled ?? false,
      incomingWebhookUrl: incomingWebhookUrl?.trim() || null,
      verificationToken:  verificationToken?.trim() || null,
      channelName:        channelName?.trim() || null,
    };

    const config = existing
      ? await prisma.teamsConfig.update({ where: { id: existing.id }, data })
      : await prisma.teamsConfig.create({ data });

    return NextResponse.json(config);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
