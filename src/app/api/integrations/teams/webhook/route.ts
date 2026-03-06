import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Teams requires a specific response envelope
const teamsOk = (text = "") =>
  NextResponse.json({ type: "message", text }, { status: 200 });

export async function POST(req: NextRequest) {
  const config = await prisma.teamsConfig.findFirst();

  // If not configured or disabled, return empty Teams-compatible response
  if (!config?.isEnabled) {
    return teamsOk();
  }

  // Read body text once for both HMAC validation and JSON parsing
  const bodyText = await req.text();

  // Validate HMAC-SHA256 signature if a verification token is configured
  if (config.verificationToken) {
    const authHeader = req.headers.get("Authorization") ?? "";
    // Teams sends: "HMAC base64signature"
    const receivedHmac = authHeader.startsWith("HMAC ")
      ? authHeader.slice(5)
      : authHeader;

    const expectedHmac = crypto
      .createHmac("sha256", Buffer.from(config.verificationToken, "base64"))
      .update(Buffer.from(bodyText, "utf8"))
      .digest("base64");

    if (receivedHmac !== expectedHmac) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teamsMessageId = (body.id as string) ?? null;
  const rawContent     = (body.text as string) ?? "";
  const senderName     = ((body.from as Record<string, string>)?.name) ?? "Teams User";

  // Strip basic HTML tags that Teams sometimes includes
  const content = rawContent.replace(/<[^>]*>/g, "").trim();

  if (!content) {
    return teamsOk("Message received");
  }

  // Deduplicate by teamsMessageId
  if (teamsMessageId) {
    const existing = await prisma.chatMessage.findFirst({
      where: { teamsMessageId },
    });
    if (existing) {
      return teamsOk("Message received");
    }
  }

  await prisma.chatMessage.create({
    data: {
      content,
      senderName,
      source:        "TEAMS",
      teamsMessageId: teamsMessageId || null,
      userId:        null,
    },
  });

  return teamsOk("Message received");
}
