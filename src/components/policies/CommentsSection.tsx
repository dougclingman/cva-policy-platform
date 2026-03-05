"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Comment = {
  id:        string;
  content:   string;
  createdAt: string;
  user:      { name: string };
};

interface Props {
  policyId:        string;
  initialComments: Comment[];
  currentUserName: string | null;
}

export function CommentsSection({ policyId, initialComments, currentUserName }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/policies/${policyId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to post comment");
        return;
      }

      const newComment: Comment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setText("");
    } catch {
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-slate-500" />
        <h2 className="font-semibold text-slate-900">
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">({comments.length})</span>
          )}
        </h2>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-slate-400">
          No comments yet. Be the first to comment.
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {comments.map((comment) => (
            <li key={comment.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{comment.user.name}</span>
                <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Post comment form */}
      {currentUserName ? (
        <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-100">
          {error && (
            <p className="mb-2 text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </button>
          </div>
        </form>
      ) : (
        <div className="px-6 py-4 border-t border-gray-100 text-sm text-slate-400 text-center">
          Sign in to post a comment.
        </div>
      )}
    </div>
  );
}
