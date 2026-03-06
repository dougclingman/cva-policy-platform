import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function POST() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const config = await prisma.merakiConfig.findFirst();

  if (!config?.apiKey) {
    return NextResponse.json(
      { success: false, error: "No API key configured" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch("https://api.meraki.com/api/v1/organizations", {
      headers: {
        "X-Cisco-Meraki-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Meraki API returned ${res.status}` },
        { status: 200 }
      );
    }

    const orgs: Array<{ id: string; name: string }> = await res.json();

    // If an orgId is configured, try to find its name; otherwise use the first org
    const matched = config.orgId
      ? orgs.find((o) => o.id === config.orgId)
      : orgs[0];

    const org = matched ?? orgs[0];
    const orgName = org?.name ?? "Unknown Organization";
    const resolvedOrgId = org?.id ?? null;

    return NextResponse.json({ success: true, orgName, resolvedOrgId });
  } catch (err) {
    console.error("[Meraki test]", err);
    return NextResponse.json(
      { success: false, error: "Failed to reach Meraki API" },
      { status: 200 }
    );
  }
}
