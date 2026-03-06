import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const announcement = await prisma.announcement.findUnique({ where: { id: params.id } });
  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dismissal = await prisma.announcementDismissal.upsert({
    where: {
      announcementId_userId: {
        announcementId: params.id,
        userId: session.user.id,
      },
    },
    update: { dismissedAt: new Date() },
    create: {
      announcementId: params.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json(dismissal);
}
