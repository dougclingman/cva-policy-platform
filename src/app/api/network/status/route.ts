import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const merakiConfig = await prisma.merakiConfig.findFirst();

  if (!merakiConfig?.isEnabled || !merakiConfig.apiKey) {
    return NextResponse.json({ devices: [], configured: false });
  }

  const { apiKey, orgId } = merakiConfig;

  if (!orgId) {
    return NextResponse.json({ devices: [], configured: false });
  }

  try {
    const res = await fetch(
      `https://api.meraki.com/api/v1/organizations/${orgId}/devices/statuses`,
      {
        headers: {
          "X-Cisco-Meraki-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { devices: [], error: `Meraki API error: ${res.status}` },
        { status: 200 }
      );
    }

    const raw: Array<Record<string, unknown>> = await res.json();

    const devices = raw.map((d) => ({
      name:           d.name,
      serial:         d.serial,
      mac:            d.mac,
      networkId:      d.networkId,
      productType:    d.productType,
      model:          d.model,
      status:         d.status,         // online | offline | alerting | dormant
      lastReportedAt: d.lastReportedAt,
      lanIp:          d.lanIp,
    }));

    return NextResponse.json({ devices, configured: true, orgId });
  } catch (err) {
    console.error("[Meraki network status]", err);
    return NextResponse.json(
      { devices: [], error: "Failed to reach Meraki API" },
      { status: 200 }
    );
  }
}
