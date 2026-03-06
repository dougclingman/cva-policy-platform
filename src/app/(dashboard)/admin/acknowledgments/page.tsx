import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Users, ChevronRight } from "lucide-react";

export const metadata = { title: "Acknowledgments" };

export default async function AcknowledgmentsPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.ADMIN_VIEW)) {
    redirect("/dashboard");
  }

  const [policies, totalUsers] = await Promise.all([
    prisma.policy.findMany({
      where: { acknowledgmentRequired: true },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { acknowledgments: true } },
        acknowledgments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { acknowledgedAt: "desc" },
        },
      },
    }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  // For each policy, compute who hasn't acknowledged
  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Header
        title="Acknowledgment Tracker"
        subtitle="Track which team members have acknowledged required policies"
      />

      {policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 mt-4">
          <CheckCircle2 className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No acknowledgment campaigns active</p>
          <p className="text-xs text-slate-400 mt-1">
            Open a published policy and click &quot;Request Acknowledgment&quot; to start tracking.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {policies.map((policy) => {
            const acknowledged = policy._count.acknowledgments;
            const pending = totalUsers - acknowledged;
            const pct = totalUsers > 0 ? Math.round((acknowledged / totalUsers) * 100) : 0;

            const acknowledgedIds = new Set(policy.acknowledgments.map((a) => a.user.id));
            const pendingUsers = allUsers.filter((u) => !acknowledgedIds.has(u.id));

            return (
              <div key={policy.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Policy Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/policies/${policy.id}`} className="font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                        {policy.title}
                      </Link>
                      {policy.acknowledgmentDeadline && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Deadline: {formatDate(policy.acknowledgmentDeadline)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{acknowledged}</span>
                      <span className="text-slate-400">/ {totalUsers}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ml-1 ${
                        pct === 100 ? "bg-green-100 text-green-700" :
                        pct >= 50   ? "bg-yellow-100 text-yellow-700" :
                                      "bg-red-100 text-red-700"
                      }`}>{pct}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full rounded-full bg-gray-100 h-2">
                    <div
                      className={`rounded-full h-2 transition-all ${pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  {/* Acknowledged */}
                  <div>
                    <div className="px-6 py-3 bg-green-50 border-b border-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Acknowledged ({acknowledged})</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {policy.acknowledgments.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-slate-400">None yet.</p>
                      ) : (
                        policy.acknowledgments.map((ack) => (
                          <div key={ack.user.id} className="flex items-center justify-between px-6 py-2.5">
                            <div>
                              <p className="text-sm text-slate-700 font-medium">{ack.user.name}</p>
                              <p className="text-xs text-slate-400">{ack.user.email}</p>
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(ack.acknowledgedAt)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pending */}
                  <div>
                    <div className="px-6 py-3 bg-red-50 border-b border-gray-100 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-800">Pending ({pending})</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {pendingUsers.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-green-700 font-medium">All users acknowledged!</p>
                      ) : (
                        pendingUsers.map((user) => (
                          <div key={user.id} className="px-6 py-2.5">
                            <p className="text-sm text-slate-700 font-medium">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
