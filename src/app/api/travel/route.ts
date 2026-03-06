import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.TRAVEL_MANAGE);
  if (error) return error;

  const requests = await prisma.travelRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy:  { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(PERMISSIONS.TRAVEL_MANAGE);
  if (error) return error;

  try {
    const body = await req.json();
    const { travelerName, travelerEmail, destinations, departureDate, returnDate, additionalTravelers } = body;

    if (!travelerName?.trim())  return NextResponse.json({ error: "Traveler name is required" },  { status: 400 });
    if (!travelerEmail?.trim()) return NextResponse.json({ error: "Traveler email is required" }, { status: 400 });
    if (!destinations?.trim())  return NextResponse.json({ error: "Destinations are required" },  { status: 400 });
    if (!departureDate)         return NextResponse.json({ error: "Departure date is required" }, { status: 400 });
    if (!returnDate)            return NextResponse.json({ error: "Return date is required" },    { status: 400 });

    const request = await prisma.travelRequest.create({
      data: {
        travelerName:        travelerName.trim(),
        travelerEmail:       travelerEmail.trim().toLowerCase(),
        destinations:        destinations.trim(),
        departureDate:       new Date(departureDate),
        returnDate:          new Date(returnDate),
        additionalTravelers: additionalTravelers?.trim() || null,
        submittedById:       session!.user.id,
      },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create travel request" }, { status: 500 });
  }
}
