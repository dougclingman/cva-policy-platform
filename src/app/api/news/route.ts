import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 minutes

export interface NewsArticle {
  title:       string;
  url:         string;
  source:      string;
  publishedAt: string;
}

function extractTag(xml: string, tag: string): string {
  // Handles both plain and CDATA variants
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdata) return cdata[1].trim();
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  return plain ? plain[1].trim() : "";
}

function parseRSS(xml: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    // Google News wraps the real URL in a redirect; grab the first <link> text node
    const linkMatch = block.match(/<link>([^<]+)<\/link>/);
    const url       = linkMatch?.[1]?.trim() ?? "";
    const source    = extractTag(block, "source");
    const pubDate   = extractTag(block, "pubDate");
    if (title && url) {
      items.push({ title, url, source, publishedAt: pubDate });
    }
  }
  return items;
}

const FEEDS = [
  // Ag tech + precision agriculture
  "https://news.google.com/rss/search?q=agricultural+technology+precision+farming&hl=en-US&gl=US&ceid=US:en",
  // Nebraska agriculture + cooperatives
  "https://news.google.com/rss/search?q=Nebraska+agriculture+cooperative+technology&hl=en-US&gl=US&ceid=US:en",
];

export async function GET() {
  try {
    const results = await Promise.allSettled(
      FEEDS.map((url) =>
        fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; CVAYield/1.0)" },
          next: { revalidate: 1800 },
        }).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      )
    );

    const seen  = new Set<string>();
    const articles: NewsArticle[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const item of parseRSS(result.value)) {
        // Deduplicate by title prefix (Google News sometimes repeats)
        const key = item.title.slice(0, 60).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          articles.push(item);
        }
        if (articles.length >= 8) break;
      }
      if (articles.length >= 8) break;
    }

    return NextResponse.json(articles);
  } catch (err) {
    console.error("[news]", err);
    return NextResponse.json([]);
  }
}
