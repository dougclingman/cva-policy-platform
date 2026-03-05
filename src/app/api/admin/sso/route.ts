import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_SSO);
  if (error) return error;

  const config = await prisma.sSOConfig.findFirst();
  return NextResponse.json(config ?? {});
}

export async function PUT(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_SSO);
  if (error) return error;

  const { provider, isEnabled, entityId, ssoUrl, certificate, defaultRoleId } = await req.json();

  const existing = await prisma.sSOConfig.findFirst();

  const data = {
    provider:      provider ?? "saml",
    isEnabled:     isEnabled ?? false,
    entityId:      entityId?.trim() || null,
    ssoUrl:        ssoUrl?.trim() || null,
    certificate:   certificate?.trim() || null,
    defaultRoleId: defaultRoleId || null,
  };

  const config = existing
    ? await prisma.sSOConfig.update({ where: { id: existing.id }, data })
    : await prisma.sSOConfig.create({ data });

  return NextResponse.json(config);
}
