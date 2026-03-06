import { Newspaper, ExternalLink } from "lucide-react";
import type { NewsArticle } from "@/app/api/news/route";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1)   return "just now";
    if (hours < 24)  return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)    return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  } catch {
    return "";
  }
}

interface Props {
  articles: NewsArticle[];
}

export function NewsWidget({ articles }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Newspaper className="h-4 w-4 text-slate-400" />
        <h2 className="font-semibold text-slate-900">Ag Tech News</h2>
        <span className="text-xs text-slate-400 ml-1">· York, NE &amp; surrounding region</span>
      </div>

      {articles.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-slate-400">
          News feed unavailable — check back shortly.
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {article.source && (
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[160px]">
                      {article.source}
                    </span>
                  )}
                  {article.source && article.publishedAt && (
                    <span className="text-slate-300 text-xs">·</span>
                  )}
                  {article.publishedAt && (
                    <span className="text-xs text-slate-400">{timeAgo(article.publishedAt)}</span>
                  )}
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
