import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requirePermission(PERMISSIONS.TRAVEL_MANAGE);
  if (error) return error;

  const request = await prisma.travelRequest.findUnique({
    where: { id: params.id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy:  { select: { id: true, name: true, email: true } },
    },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error, session } = await requirePermission(PERMISSIONS.TRAVEL_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { action, notes } = body;

    const existing = await prisma.travelRequest.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let data: Record<string, unknown> = {};

    if (action === "configure") {
      if (existing.status !== "PENDING") {
        return NextResponse.json({ error: "Can only configure PENDING requests" }, { status: 400 });
      }
      data = {
        status:               "EXCEPTION_ACTIVE",
        securityNotes:        notes?.trim() || null,
        reviewedById:         session!.user.id,
        exceptionConfiguredAt: new Date(),
      };
    } else if (action === "remove") {
      if (existing.status !== "EXCEPTION_ACTIVE") {
        return NextResponse.json({ error: "Can only remove EXCEPTION_ACTIVE requests" }, { status: 400 });
      }
      data = {
        status:             "EXCEPTION_REMOVED",
        exceptionRemovedAt: new Date(),
      };
    } else if (action === "deny") {
      if (existing.status !== "PENDING") {
        return NextResponse.json({ error: "Can only deny PENDING requests" }, { status: 400 });
      }
      data = {
        status:        "DENIED",
        securityNotes: notes?.trim() || null,
        reviewedById:  session!.user.id,
      };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.travelRequest.update({
      where: { id: params.id },
      data,
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy:  { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update travel request" }, { status: 500 });
  }
}
