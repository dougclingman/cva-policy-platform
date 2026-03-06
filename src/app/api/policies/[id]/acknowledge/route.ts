import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

// POST — record current user's acknowledgment
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  const policy = await prisma.policy.findUnique({ where: { id: params.id } });
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!policy.acknowledgmentRequired) {
    return NextResponse.json({ error: "This policy does not require acknowledgment" }, { status: 400 });
  }

  const ack = await prisma.policyAcknowledgment.upsert({
    where: { policyId_userId: { policyId: params.id, userId: session!.user.id } },
    update: { acknowledgedAt: new Date() },
    create: { policyId: params.id, userId: session!.user.id },
  });

  return NextResponse.json(ack);
}

// GET — acknowledgment status for current user + admin summary
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  const [myAck, policy] = await Promise.all([
    prisma.policyAcknowledgment.findUnique({
      where: { policyId_userId: { policyId: params.id, userId: session!.user.id } },
    }),
    prisma.policy.findUnique({
      where: { id: params.id },
      select: { acknowledgmentRequired: true, acknowledgmentDeadline: true },
    }),
  ]);

  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session!.user.permissions.includes(PERMISSIONS.POLICIES_PUBLISH);

  let summary = null;
  if (isAdmin) {
    const [totalUsers, acknowledged] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.policyAcknowledgment.count({ where: { policyId: params.id } }),
    ]);
    const pending = await prisma.user.findMany({
      where: {
        isActive: true,
        acknowledgments: { none: { policyId: params.id } },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    summary = { totalUsers, acknowledged, pending };
  }

  return NextResponse.json({
    acknowledged: !!myAck,
    acknowledgedAt: myAck?.acknowledgedAt ?? null,
    policy,
    summary,
  });
}
