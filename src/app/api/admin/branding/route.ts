import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const branding = await prisma.brandingConfig.findFirst();
  return NextResponse.json(
    branding ?? { platformName: "Yield", tagline: null, logoUrl: null, faviconUrl: null }
  );
}

export async function PUT(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  try {
    const { platformName, tagline, logoUrl, faviconUrl } = await req.json();

    if (!platformName?.trim()) {
      return NextResponse.json({ error: "Platform name is required" }, { status: 400 });
    }

    const branding = await prisma.brandingConfig.upsert({
      where: { id: "default" },
      update: {
        platformName: platformName.trim(),
        tagline:      tagline?.trim()   || null,
        logoUrl:      logoUrl?.trim()   || null,
        faviconUrl:   faviconUrl?.trim() || null,
      },
      create: {
        id:           "default",
        platformName: platformName.trim(),
        tagline:      tagline?.trim()   || null,
        logoUrl:      logoUrl?.trim()   || null,
        faviconUrl:   faviconUrl?.trim() || null,
      },
    });

    return NextResponse.json(branding);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
