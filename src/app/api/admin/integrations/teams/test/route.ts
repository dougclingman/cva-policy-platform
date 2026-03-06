import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function POST() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_VIEW);
  if (error) return error;

  const config = await prisma.teamsConfig.findFirst();

  if (!config?.incomingWebhookUrl) {
    return NextResponse.json(
      { error: "No incoming webhook URL configured" },
      { status: 400 }
    );
  }

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.2",
          body: [
            {
              type: "TextBlock",
              text: "**CVA Platform** — Test message. Teams integration is configured correctly!",
              wrap: true,
            },
          ],
        },
      },
    ],
  };

  try {
    const res = await fetch(config.incomingWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Teams webhook returned ${res.status}: ${text}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: "Test message sent to Teams" });
  } catch (err) {
    console.error("[Teams test]", err);
    return NextResponse.json(
      { error: "Failed to reach Teams webhook URL" },
      { status: 502 }
    );
  }
}
