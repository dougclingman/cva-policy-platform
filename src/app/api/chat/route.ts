import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const where = after
    ? { createdAt: { gt: new Date(after) } }
    : {};

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 50,
    include: {
      user: { select: { name: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(PERMISSIONS.POLICIES_READ);
  if (error) return error;

  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content:    content.trim(),
        userId:     session!.user.id,
        senderName: session!.user.name ?? "Unknown",
        source:     "PLATFORM",
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Fire-and-forget: forward to Teams if configured
    prisma.teamsConfig.findFirst().then((config) => {
      if (config?.isEnabled && config.incomingWebhookUrl) {
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
                    text: `**${message.senderName}** (CVA Platform): ${message.content}`,
                    wrap: true,
                  },
                ],
              },
            },
          ],
        };

        fetch(config.incomingWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(card),
        })
          .then(() => {})
          .catch((err) => console.error("[Teams webhook] failed to forward message:", err));
      }
    }).catch((err) => console.error("[Teams config] failed to fetch config:", err));

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
