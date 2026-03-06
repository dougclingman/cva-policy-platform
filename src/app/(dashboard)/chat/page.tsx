import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChatUI } from "@/components/chat/ChatUI";

export const metadata = { title: "IT Chat" };

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [rawMessages, teamsConfig] = await Promise.all([
    prisma.chatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { user: { select: { name: true } } },
    }),
    prisma.teamsConfig.findFirst(),
  ]);

  // Serialize dates to strings for client component
  const initialMessages = rawMessages.map((m) => ({
    id:             m.id,
    content:        m.content,
    senderName:     m.senderName,
    source:         m.source as "PLATFORM" | "TEAMS",
    createdAt:      m.createdAt.toISOString(),
    userId:         m.userId,
    teamsMessageId: m.teamsMessageId,
  }));

  return (
    <ChatUI
      initialMessages={initialMessages}
      teamsChannelName={teamsConfig?.isEnabled && teamsConfig?.channelName ? teamsConfig.channelName : undefined}
    />
  );
}
