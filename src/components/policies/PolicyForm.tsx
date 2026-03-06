"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/utils";

interface Tag { id: string; name: string }
interface Policy {
  id?: string;
  title: string;
  summary?: string | null;
  content: string;
  category?: string | null;
  status: string;
  tags: { tag: Tag }[];
  reviewFrequency?: string | null;
  nextReviewDate?: string | Date | null;
  reviewReminderDays?: number | null;
}

interface Props {
  policy?: Policy;
  tags: Tag[];
  mode: "create" | "edit";
}

const CATEGORIES = [
  "Governance", "Security", "Data Governance", "Network", "Access Control",
  "Compliance", "HR", "Software", "Hardware", "Operations",
];

const REVIEW_FREQUENCIES = [
  { value: "NONE",       label: "No scheduled review" },
  { value: "MONTHLY",    label: "Monthly" },
  { value: "QUARTERLY",  label: "Quarterly (every 3 months)" },
  { value: "SEMI_ANNUAL", label: "Semi-Annual (every 6 months)" },
  { value: "ANNUAL",     label: "Annual (every year)" },
];

function calcNextReviewDate(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case "MONTHLY":    now.setMonth(now.getMonth() + 1); break;
    case "QUARTERLY":  now.setMonth(now.getMonth() + 3); break;
    case "SEMI_ANNUAL": now.setMonth(now.getMonth() + 6); break;
    case "ANNUAL":     now.setFullYear(now.getFullYear() + 1); break;
    default:           return "";
  }
  return now.toISOString().slice(0, 10);
}

export function PolicyForm({ policy, tags, mode }: Props) {
  const router = useRouter();

  const [title,    setTitle]    = useState(policy?.title ?? "");
  const [summary,  setSummary]  = useState(policy?.summary ?? "");
  const [content,  setContent]  = useState(policy?.content ?? "");
  const [category, setCategory] = useState(policy?.category ?? "");
  const [status,   setStatus]   = useState(policy?.status ?? "DRAFT");
  const [selTags,  setSelTags]  = useState<string[]>(policy?.tags.map((t) => t.tag.id) ?? []);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const [reviewFrequency,    setReviewFrequency]    = useState(policy?.reviewFrequency ?? "NONE");
  const [nextReviewDate,     setNextReviewDate]     = useState(
    policy?.nextReviewDate ? new Date(policy.nextReviewDate).toISOString().slice(0, 10) : ""
  );
  const [reviewReminderDays, setReviewReminderDays] = useState(
    policy?.reviewReminderDays ?? 30
  );

  const CONTENT_TEMPLATE = `# ${title || "Policy Title"}

## 1. Purpose
[Describe the purpose of this policy]

## 2. Scope
[Define who and what this policy applies to]

## 3. Policy Statement
[Describe the policy requirements]

## 4. Responsibilities
[List roles and their responsibilities]

## 5. Enforcement
[Describe consequences for non-compliance]

## 6. Review Schedule
This policy is reviewed annually.
`;

  function toggleTag(tagId: string) {
    setSelTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function handleFrequencyChange(freq: string) {
    setReviewFrequency(freq);
    if (freq !== "NONE") {
      setNextReviewDate(calcNextReviewDate(freq));
    } else {
      setNextReviewDate("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!content.trim()) { setError("Content is required"); return; }
    setError("");
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slugify(title.trim()),
        summary: summary.trim() || null,
        content: content.trim(),
        category: category || null,
        status,
        tagIds: selTags,
        reviewFrequency,
        nextReviewDate: nextReviewDate || null,
        reviewReminderDays: Number(reviewReminderDays),
      };

      const url    = mode === "create" ? "/api/policies" : `/api/policies/${policy!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save policy");
        return;
      }

      const saved = await res.json();
      router.push(`/policies/${saved.id}`);
      router.refresh();
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
        {/* Main */}
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
              placeholder="e.g. Acceptable Use Policy"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief one-line description"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Content (Markdown) <span className="text-red-500">*</span>
              </label>
              {mode === "create" && !content && (
                <button
                  type="button"
                  onClick={() => setContent(CONTENT_TEMPLATE)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Use template
                </button>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              placeholder="Write your policy content in Markdown..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono resize-y"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Supports Markdown formatting — headings, tables, lists, bold, italic, etc.</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="">— None —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Review Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Review Schedule</label>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Review Frequency</label>
              <select
                value={reviewFrequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {REVIEW_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {reviewFrequency !== "NONE" && (
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Next Review Date</label>
                  <input
                    type="date"
                    value={nextReviewDate}
                    onChange={(e) => setNextReviewDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Reminder Lead Time (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={reviewReminderDays}
                    onChange={(e) => setReviewReminderDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">Flag as due this many days before the review date</p>
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    selTags.includes(tag.id)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" loading={loading}>
              {mode === "create" ? "Create Policy" : "Save Changes"}
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
