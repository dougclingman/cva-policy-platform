"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

interface Props {
  categories: string[];
  tags: string[];
  canFilterStatus: boolean;
  currentFilters: { q?: string; status?: string; category?: string; tag?: string };
}

const STATUSES = [
  { value: "",             label: "All Statuses" },
  { value: "DRAFT",        label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "PUBLISHED",    label: "Published" },
  { value: "ARCHIVED",     label: "Archived" },
];

export function PoliciesFilters({ categories, tags, canFilterStatus, currentFilters }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/policies?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => router.push("/policies");

  const hasFilters = currentFilters.q || currentFilters.status || currentFilters.category || currentFilters.tag;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies..."
            defaultValue={currentFilters.q ?? ""}
            onChange={(e) => updateFilter("q", e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category */}
        <select
          value={currentFilters.category ?? ""}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Tag */}
        <select
          value={currentFilters.tag ?? ""}
          onChange={(e) => updateFilter("tag", e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          <option value="">All Tags</option>
          {tags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Status (only for non-viewers) */}
        {canFilterStatus && (
          <select
            value={currentFilters.status ?? ""}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-500 hover:bg-gray-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
