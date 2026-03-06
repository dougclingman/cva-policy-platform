"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, Send, Info } from "lucide-react";

export interface ChatMessage {
  id:             string;
  content:        string;
  senderName:     string;
  source:         "PLATFORM" | "TEAMS";
  createdAt:      string;
  userId:         string | null;
  teamsMessageId: string | null;
}

interface Props {
  initialMessages:  ChatMessage[];
  teamsChannelName?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d   = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate();
  return isToday ? "Today" : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Group messages by calendar date
function groupByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const label = formatDate(msg.createdAt);
    if (!groups.length || groups[groups.length - 1].date !== label) {
      groups.push({ date: label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export function ChatUI({ initialMessages, teamsChannelName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft,    setDraft]    = useState("");
  const [sending,  setSending]  = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  // Keep a ref to the latest messages array so the polling interval can read
  // the most recent timestamp without becoming stale
  const messagesRef  = useRef<ChatMessage[]>(initialMessages);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const poll = useCallback(async () => {
    const current = messagesRef.current;
    const after   = current.length ? current[current.length - 1].createdAt : null;

    try {
      const url = after
        ? `/api/chat?after=${encodeURIComponent(after)}`
        : "/api/chat";
      const res = await fetch(url);
      if (!res.ok) return;
      const fresh: ChatMessage[] = await res.json();
      if (fresh.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes     = fresh.filter((m) => !existingIds.has(m.id));
          return newOnes.length ? [...prev, ...newOnes] : prev;
        });
      }
    } catch {
      // silently ignore poll errors
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(poll, 10_000);
    return () => clearInterval(intervalId);
  }, [poll]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setDraft("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const msg: ChatMessage = await res.json();
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          return existingIds.has(msg.id) ? prev : [...prev, msg];
        });
      }
    } catch {
      // restore draft on failure
      setDraft(content);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page title row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">IT Chat</h1>
          <p className="text-sm text-slate-500 mt-0.5">Team communication hub</p>
        </div>
        {teamsChannelName && (
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded bg-[#4B53BC]">
              <span className="text-white font-bold text-[9px] leading-none">T</span>
            </div>
            Syncing with #{teamsChannelName}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to say something!</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {groups.map(({ date, messages: groupMsgs }) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs font-medium text-slate-400 px-2">{date}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-2">
                  {groupMsgs.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Teams sync info bar */}
      {teamsChannelName && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg mt-2 text-xs text-blue-700">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Messages also syncing with <strong>#{teamsChannelName}</strong> in Teams
        </div>
      )}

      {/* Compose area */}
      <div className="mt-3 flex items-end gap-3 rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 resize-none rounded-lg border-0 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 py-1 max-h-32 overflow-y-auto leading-5"
          style={{ minHeight: "2rem" }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isTeams = msg.source === "TEAMS";

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
        isTeams ? "bg-blue-50" : "bg-white border border-gray-100"
      }`}
    >
      {/* Avatar / source icon */}
      {isTeams ? (
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4B53BC] shrink-0 mt-0.5">
          <span className="text-white font-bold text-xs leading-none">T</span>
        </div>
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 shrink-0 mt-0.5">
          <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">{msg.senderName}</span>
          {isTeams && (
            <span className="inline-flex items-center gap-0.5 rounded bg-[#4B53BC]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#4B53BC]">
              Teams
            </span>
          )}
          <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
        </div>
        {/* Content */}
        <p className="mt-0.5 text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
          {msg.content}
        </p>
      </div>
    </div>
  );
}
