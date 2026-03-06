import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — save a new push subscription
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, keys, userAgent } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent ?? null },
    create: {
      userId:    session.user.id,
      endpoint,
      p256dh:    keys.p256dh,
      auth:      keys.auth,
      userAgent: userAgent ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — remove a push subscription
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}

// GET — check if current user has any active subscriptions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ subscribed: false });

  const count = await prisma.pushSubscription.count({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ subscribed: count > 0 });
}
