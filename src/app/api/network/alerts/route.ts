import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT   ?? "mailto:it@cva.internal",
  process.env.VAPID_PUBLIC_KEY  ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

type DeviceStatus = { serial: string; name: string; status: string };

// POST — compare current offline devices to last snapshot; push to all subscribers if new outages
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const merakiConfig = await prisma.merakiConfig.findFirst();
  if (!merakiConfig?.isEnabled || !merakiConfig.apiKey) {
    return NextResponse.json({ checked: false, reason: "Meraki not configured" });
  }

  // Resolve org ID
  let orgId = merakiConfig.orgId ?? null;
  try {
    const orgsRes = await fetch("https://api.meraki.com/api/v1/organizations", {
      headers: { "X-Cisco-Meraki-API-Key": merakiConfig.apiKey },
    });
    if (orgsRes.ok) {
      const orgs: Array<{ id: string }> = await orgsRes.json();
      const matched = orgId ? orgs.find((o) => o.id === orgId) : orgs[0];
      orgId = (matched ?? orgs[0])?.id ?? orgId;
    }
  } catch { /* use stored orgId */ }

  if (!orgId) return NextResponse.json({ checked: false, reason: "No org ID" });

  // Fetch current statuses
  let devices: DeviceStatus[] = [];
  try {
    const r = await fetch(
      `https://api.meraki.com/api/v1/organizations/${orgId}/devices/statuses`,
      { headers: { "X-Cisco-Meraki-API-Key": merakiConfig.apiKey } }
    );
    if (r.ok) devices = await r.json();
  } catch {
    return NextResponse.json({ checked: false, reason: "Meraki API unreachable" });
  }

  const currentOffline = devices.filter(
    (d) => d.status === "offline" || d.status === "alerting"
  );
  const currentSerials = new Set(currentOffline.map((d) => d.serial));

  // Load last snapshot
  const snapshot = await prisma.networkAlertSnapshot.findUnique({ where: { id: "singleton" } });
  const prevSerials: string[] = snapshot ? JSON.parse(snapshot.offlineSerials) : [];
  const prevSet = new Set(prevSerials);

  // Find NEW outages (not in previous snapshot)
  const newOffline = currentOffline.filter((d) => !prevSet.has(d.serial));

  // Update snapshot
  await prisma.networkAlertSnapshot.upsert({
    where:  { id: "singleton" },
    update: { offlineSerials: JSON.stringify(Array.from(currentSerials)), checkedAt: new Date() },
    create: { id: "singleton", offlineSerials: JSON.stringify(Array.from(currentSerials)) },
  });

  if (newOffline.length === 0) {
    return NextResponse.json({ checked: true, newOutages: 0, totalOffline: currentOffline.length });
  }

  // Build push payload
  const deviceList = newOffline.slice(0, 3).map((d) => d.name || d.serial).join(", ");
  const extra = newOffline.length > 3 ? ` +${newOffline.length - 3} more` : "";
  const payload = JSON.stringify({
    title:              `⚠️ Network Alert — ${newOffline.length} device${newOffline.length > 1 ? "s" : ""} offline`,
    body:               `${deviceList}${extra} went offline.`,
    icon:               "/favicon.ico",
    tag:                "network-alert",
    url:                "/network",
    requireInteraction: true,
  });

  // Send to all subscribers
  const subscribers = await prisma.pushSubscription.findMany();
  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        // Remove expired/invalid subscriptions (410 Gone)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        throw err;
      })
    )
  );

  const sent   = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ checked: true, newOutages: newOffline.length, totalOffline: currentOffline.length, sent, failed });
}
