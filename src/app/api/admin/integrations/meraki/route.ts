import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const config = await prisma.merakiConfig.findFirst();
  return NextResponse.json(config ?? {});
}

export async function PUT(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  try {
    const { isEnabled, apiKey, orgId } = await req.json();

    const existing = await prisma.merakiConfig.findFirst();

    const data = {
      isEnabled: isEnabled ?? false,
      apiKey:    apiKey?.trim() || null,
      orgId:     orgId?.trim() || null,
    };

    const config = existing
      ? await prisma.merakiConfig.update({ where: { id: existing.id }, data })
      : await prisma.merakiConfig.create({ data });

    return NextResponse.json(config);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
