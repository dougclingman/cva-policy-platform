import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Badge, policyStatusVariant, policyStatusLabel } from "@/components/ui/Badge";
import { FileText, CheckCircle, Clock, Archive, Users, Eye, AlertTriangle, Bell, Plane, PhoneCall, ExternalLink, Network, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { AnnouncementBanners } from "@/components/announcements/AnnouncementBanners";
import { WeatherWidget, WeatherWidgetError } from "@/components/dashboard/WeatherWidget";
import { NewsWidget } from "@/components/dashboard/NewsWidget";
import type { WeatherData } from "@/app/api/weather/route";
import type { NewsArticle } from "@/app/api/news/route";

export const metadata = { title: "Dashboard" };

async function getStats(userId: string, permissions: string[]) {
  const canSeeAll    = permissions.includes(PERMISSIONS.POLICIES_CREATE);
  const canTravel    = permissions.includes(PERMISSIONS.TRAVEL_MANAGE);
  const now = new Date();

  const [total, published, underReview, draft, archived, userCount, recentPolicies,
         reviewDuePolicies, pendingAcks, travelPending, travelRemovalDue,
         activeAnnouncements, currentOnCall, quickLinks] =
    await Promise.all([
      prisma.policy.count(),
      prisma.policy.count({ where: { status: "PUBLISHED" } }),
      prisma.policy.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.policy.count({ where: { status: "DRAFT" } }),
      prisma.policy.count({ where: { status: "ARCHIVED" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.policy.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { createdBy: { select: { name: true } }, tags: { include: { tag: true } } },
      }),
      // Policies due for review (within lead time window or overdue)
      canSeeAll ? prisma.policy.findMany({
        where: {
          status: { not: "ARCHIVED" },
          reviewFrequency: { not: "NONE" },
          nextReviewDate: { not: null },
          AND: [{
            nextReviewDate: {
              lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            }
          }]
        },
        orderBy: { nextReviewDate: "asc" },
        take: 10,
        select: { id: true, title: true, nextReviewDate: true, reviewFrequency: true, status: true },
      }) : Promise.resolve([]),
      // Policies this user needs to acknowledge
      prisma.policy.findMany({
        where: {
          acknowledgmentRequired: true,
          status: "PUBLISHED",
          acknowledgments: { none: { userId } },
        },
        select: { id: true, title: true, acknowledgmentDeadline: true },
        orderBy: { acknowledgmentDeadline: "asc" },
        take: 10,
      }),
      // Travel: pending exception requests
      canTravel ? prisma.travelRequest.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
      // Travel: active exceptions past return date (removal due)
      canTravel ? prisma.travelRequest.count({ where: { status: "EXCEPTION_ACTIVE", returnDate: { lt: now } } }) : Promise.resolve(0),
      // Active published announcements not yet dismissed by this user
      prisma.announcement.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          dismissals: { none: { userId } },
        },
        orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
        select: { id: true, title: true, body: true, priority: true },
        take: 5,
      }),
      // Current on-call person
      prisma.onCallEntry.findFirst({
        where: { startDate: { lte: now }, endDate: { gte: now } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { startDate: "desc" },
      }),
      // Active quick links for dashboard widget
      prisma.quickLink.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
    ]);
  return { total, published, underReview, draft, archived, userCount, recentPolicies, reviewDuePolicies, pendingAcks, travelPending, travelRemovalDue, activeAnnouncements, currentOnCall, quickLinks };
}

function reviewDueClass(date: Date): string {
  const now = new Date();
  if (date < now) return "text-red-600 bg-red-50";
  const diff = date.getTime() - now.getTime();
  if (diff < 14 * 24 * 60 * 60 * 1000) return "text-red-500 bg-red-50";
  return "text-yellow-600 bg-yellow-50";
}

function reviewDueLabel(date: Date): string {
  const now = new Date();
  if (date < now) return "Overdue";
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const permissions = session!.user.permissions ?? [];
  const canSeeAll = permissions.includes(PERMISSIONS.POLICIES_CREATE);
  const canTravel = permissions.includes(PERMISSIONS.TRAVEL_MANAGE);
  const stats = await getStats(userId, permissions);

  // Network alerts — only if Meraki configured
  const merakiConfig = await prisma.merakiConfig.findFirst();
  let offlineCount = 0;
  if (merakiConfig?.isEnabled && merakiConfig.apiKey) {
    try {
      // Resolve real org ID (same pattern as network/page.tsx)
      const orgsRes = await fetch("https://api.meraki.com/api/v1/organizations", {
        headers: { "X-Cisco-Meraki-API-Key": merakiConfig.apiKey },
        next: { revalidate: 300 },
      });
      if (orgsRes.ok) {
        const orgs: Array<{ id: string }> = await orgsRes.json();
        const matched = merakiConfig.orgId ? orgs.find((o) => o.id === merakiConfig.orgId) : orgs[0];
        const org = matched ?? orgs[0];
        if (org) {
          const r = await fetch(
            `https://api.meraki.com/api/v1/organizations/${org.id}/devices/statuses`,
            { headers: { "X-Cisco-Meraki-API-Key": merakiConfig.apiKey }, next: { revalidate: 60 } }
          );
          if (r.ok) {
            const devs = await r.json();
            offlineCount = devs.filter((d: { status: string }) => d.status === "offline" || d.status === "alerting").length;
          }
        }
      }
    } catch { /* ignore */ }
  }

  // Weather + News — fetched in parallel, failures are non-fatal
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const [weatherRes, newsRes] = await Promise.allSettled([
    fetch(`${baseUrl}/api/weather`, { next: { revalidate: 1800 } }),
    fetch(`${baseUrl}/api/news`,    { next: { revalidate: 1800 } }),
  ]);
  const weather: WeatherData | null =
    weatherRes.status === "fulfilled" && weatherRes.value.ok
      ? await weatherRes.value.json()
      : null;
  const news: NewsArticle[] =
    newsRes.status === "fulfilled" && newsRes.value.ok
      ? await newsRes.value.json()
      : [];

  const statCards = [
    { label: "Total Policies",  value: stats.total,       icon: FileText,     color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Published",       value: stats.published,   icon: CheckCircle,  color: "text-green-600",  bg: "bg-green-50" },
    { label: "Under Review",    value: stats.underReview, icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Draft",           value: stats.draft,       icon: Eye,          color: "text-slate-500",  bg: "bg-slate-50" },
    { label: "Archived",        value: stats.archived,    icon: Archive,      color: "text-red-500",    bg: "bg-red-50" },
    { label: "Active Users",    value: stats.userCount,   icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <Header
        title={`Welcome back, ${session?.user?.name?.split(" ")[0]}`}
        subtitle="Here's an overview of your IT Policy Platform"
      />

      {/* ── Zone 1: Urgent alerts ─────────────────────────────────── */}

      {stats.activeAnnouncements.length > 0 && (
        <AnnouncementBanners announcements={stats.activeAnnouncements as Array<{ id: string; title: string; body: string; priority: "INFO" | "WARNING" | "CRITICAL" }>} />
      )}

      {/* Network outage alert — elevated when devices are down */}
      {merakiConfig?.isEnabled && offlineCount > 0 && (
        <Link
          href="/network"
          className="flex items-center gap-4 rounded-xl border-2 border-red-300 bg-red-50 px-6 py-4 hover:bg-red-100 transition-colors"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <Network className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {offlineCount} network device{offlineCount !== 1 ? "s" : ""} offline or alerting
            </p>
            <p className="text-xs text-red-600 mt-0.5">Click to view Network Status →</p>
          </div>
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        </Link>
      )}

      {/* ── Zone 2: Action items (things needing attention today) ──── */}

      <div className={`grid grid-cols-1 gap-6 ${canSeeAll ? "lg:grid-cols-2" : ""}`}>
        {/* Pending Acknowledgments — always shown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Bell className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-slate-900">Awaiting Your Acknowledgment</h2>
            {stats.pendingAcks.length > 0 && (
              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5">
                {stats.pendingAcks.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {stats.pendingAcks.length === 0 ? (
              <div className="flex items-center gap-2 px-6 py-5 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                You&apos;re all caught up — no pending acknowledgments.
              </div>
            ) : (
              stats.pendingAcks.map((policy) => (
                <Link
                  key={policy.id}
                  href={`/policies/${policy.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{policy.title}</p>
                    {policy.acknowledgmentDeadline && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Deadline: {formatDate(policy.acknowledgmentDeadline)}
                      </p>
                    )}
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                    Action needed
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Policies Due for Review — admin/managers only */}
        {canSeeAll && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h2 className="font-semibold text-slate-900">Policies Due for Review</h2>
              {stats.reviewDuePolicies.length > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5">
                  {stats.reviewDuePolicies.length}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {stats.reviewDuePolicies.length === 0 ? (
                <div className="flex items-center gap-2 px-6 py-5 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  No policies are due for review.
                </div>
              ) : (
                stats.reviewDuePolicies.map((policy) => {
                  const due = policy.nextReviewDate!;
                  const cls = reviewDueClass(due);
                  return (
                    <Link
                      key={policy.id}
                      href={`/policies/${policy.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{policy.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {policy.reviewFrequency.replace("_", " ")} review · {formatDate(due)}
                        </p>
                      </div>
                      <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
                        {reviewDueLabel(due)}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Travel Exceptions — managers only, only when there's something to act on */}
      {canTravel && (stats.travelPending > 0 || stats.travelRemovalDue > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Plane className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-slate-900">Travel Exception Requests</h2>
            <Link href="/travel" className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="px-6 py-5 flex flex-wrap gap-4">
            {stats.travelPending > 0 && (
              <Link href="/travel" className="flex items-center gap-3 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 hover:bg-yellow-100 transition-colors">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold text-yellow-800">{stats.travelPending}</p>
                  <p className="text-xs text-yellow-700">Pending Configuration</p>
                </div>
              </Link>
            )}
            {stats.travelRemovalDue > 0 && (
              <Link href="/travel" className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 hover:bg-red-100 transition-colors">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold text-red-800">{stats.travelRemovalDue}</p>
                  <p className="text-xs text-red-700">Removal Due</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Zone 3: Operational snapshot ─────────────────────────── */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* On-Call Now */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold text-slate-700">On-Call Now</h3>
            </div>
            <Link href="/oncall" className="text-xs text-blue-600 hover:text-blue-700">Schedule →</Link>
          </div>
          {stats.currentOnCall ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <PhoneCall className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{stats.currentOnCall.user.name}</p>
                <p className="text-xs text-slate-400">
                  Until {formatDate(stats.currentOnCall.endDate)}
                  {stats.currentOnCall.phoneOverride && (
                    <span className="ml-1 font-medium text-slate-600">{stats.currentOnCall.phoneOverride}</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No one scheduled on-call.</p>
          )}
        </div>

        {/* Network healthy state — only when no outages */}
        {merakiConfig?.isEnabled && offlineCount === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Network Status</h3>
              </div>
              <Link href="/network" className="text-xs text-blue-600 hover:text-blue-700">View all →</Link>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">All devices online</span>
            </div>
          </div>
        )}

        {/* Stat summary pill — compact counts for quick reference */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Policy Overview</h3>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.published}</div>
              <div className="text-xs text-slate-500">Published</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-500">{stats.underReview}</div>
              <div className="text-xs text-slate-500">In Review</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-500">{stats.draft}</div>
              <div className="text-xs text-slate-500">Draft</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-500">{stats.userCount}</div>
              <div className="text-xs text-slate-500">Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zone 4: Quick links ───────────────────────────────────── */}

      {stats.quickLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <ExternalLink className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-slate-900">Quick Links</h2>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.quickLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-50 transition-colors text-base select-none">
                  {link.icon ? (
                    <span>{link.icon}</span>
                  ) : (
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                    {link.title}
                  </p>
                  {link.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{link.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Zone 5: Ambient info ──────────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          {weather && !("error" in weather)
            ? <WeatherWidget weather={weather} />
            : <WeatherWidgetError />}
        </div>
        <div className="lg:col-span-2">
          <NewsWidget articles={news} />
        </div>
      </div>

      {/* ── Zone 6: Recent activity ───────────────────────────────── */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-slate-900">Recent Policies</h2>
          <Link href="/policies" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentPolicies.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">No policies yet.</div>
          )}
          {stats.recentPolicies.map((policy) => (
            <Link
              key={policy.id}
              href={`/policies/${policy.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{policy.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {policy.category && <span className="mr-2">{policy.category}</span>}
                  Updated {formatDate(policy.updatedAt)} by {policy.createdBy.name}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {policy.tags.slice(0, 2).map((pt) => (
                  <span key={pt.tag.id} className="hidden sm:inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {pt.tag.name}
                  </span>
                ))}
                <Badge variant={policyStatusVariant(policy.status)}>
                  {policyStatusLabel(policy.status)}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
