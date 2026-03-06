"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Tag {
  id: string;
  name: string;
}

interface RunbookData {
  id?: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  content: string;
  tagIds: string[];
}

interface Props {
  tags: Tag[];
  runbook?: RunbookData;
}

export function RunbookForm({ tags, runbook }: Props) {
  const router = useRouter();
  const isEdit = !!runbook?.id;

  const [title,    setTitle]    = useState(runbook?.title ?? "");
  const [category, setCategory] = useState(runbook?.category ?? "");
  const [summary,  setSummary]  = useState(runbook?.summary ?? "");
  const [content,  setContent]  = useState(runbook?.content ?? "");
  const [selTags,  setSelTags]  = useState<string[]>(runbook?.tagIds ?? []);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  function toggleTag(tagId: string) {
    setSelTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!content.trim()) { setError("Content is required"); return; }
    setError("");
    setLoading(true);

    try {
      const payload = {
        title:    title.trim(),
        summary:  summary.trim() || null,
        content:  content.trim(),
        category: category.trim() || null,
        tagIds:   selTags,
      };

      const url    = isEdit ? `/api/runbooks/${runbook!.id}` : "/api/runbooks";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save runbook");
        return;
      }

      const saved = await res.json();
      const id = isEdit ? runbook!.id : saved.id;
      router.push(`/runbooks/${id}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Server Restart Procedure"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              placeholder="Brief description of what this runbook covers"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Content (Markdown) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              placeholder="Write your runbook steps in Markdown..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono resize-y"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Supports Markdown — headings, numbered lists, code blocks, tables, bold, italic, etc.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Networking, Security"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <div className="flex flex-col gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" loading={loading}>
              {isEdit ? "Save Changes" : "Create Runbook"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
