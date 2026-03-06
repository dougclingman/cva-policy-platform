import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { PhoneCall, Plus, CalendarDays, Phone, UserCheck } from "lucide-react";

export const metadata = { title: "On-Call Schedule" };

export default async function OnCallPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/dashboard");
  }

  const canManage = hasPermission(
    session?.user?.permissions ?? [],
    PERMISSIONS.ONCALL_MANAGE,
  );

  const entries = await prisma.onCallEntry.findMany({
    orderBy: { startDate: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const now = new Date();

  const current  = entries.find((e) => e.startDate <= now && e.endDate >= now) ?? null;
  const upcoming = entries.filter((e) => e.startDate > now);
  const past     = entries.filter((e) => e.endDate < now);

  return (
    <div>
      <Header
        title="On-Call Schedule"
        subtitle="View who is currently on call and upcoming on-call rotations"
        actions={
          canManage ? (
            <Link
              href="/oncall/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </Link>
          ) : undefined
        }
      />

      {/* Currently On Call Banner */}
      {current ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5 mb-6 flex items-start gap-4">
          <div className="flex-shrink-0 rounded-full bg-green-100 p-2.5">
            <PhoneCall className="h-5 w-5 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-0.5">
              Currently On Call
            </p>
            <p className="text-lg font-semibold text-slate-900">{current.user.name}</p>
            {current.phoneOverride && (
              <div className="flex items-center gap-1.5 mt-1">
                <Phone className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">{current.phoneOverride}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-sm text-slate-500">
                {formatDate(current.startDate)} – {formatDate(current.endDate)}
              </span>
            </div>
            {current.notes && (
              <p className="text-sm text-slate-600 mt-1.5 italic">{current.notes}</p>
            )}
          </div>
          {canManage && (
            <Link
              href={`/oncall/${current.id}/edit`}
              className="flex-shrink-0 text-sm font-medium text-green-700 hover:text-green-800 hover:underline"
            >
              Edit
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 mb-6 flex items-center gap-4">
          <div className="flex-shrink-0 rounded-full bg-gray-100 p-2.5">
            <UserCheck className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">No one currently on call</p>
            <p className="text-xs text-slate-400 mt-0.5">
              No on-call entry is active for today&apos;s date.
            </p>
          </div>
        </div>
      )}

      {/* Upcoming Entries */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-10">
            <CalendarDays className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No upcoming on-call entries</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcoming.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{entry.user.name}</p>
                      <p className="text-xs text-slate-400">{entry.user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{formatDate(entry.startDate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{formatDate(entry.endDate)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {entry.phoneOverride ? (
                        <span className="text-sm text-slate-700">{entry.phoneOverride}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {entry.notes ? (
                        <span className="text-sm text-slate-600 truncate block">{entry.notes}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/oncall/${entry.id}/edit`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Entries */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Past Entries
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {past.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors opacity-75">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{entry.user.name}</p>
                      <p className="text-xs text-slate-400">{entry.user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500">{formatDate(entry.startDate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500">{formatDate(entry.endDate)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {entry.phoneOverride ? (
                        <span className="text-sm text-slate-500">{entry.phoneOverride}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {entry.notes ? (
                        <span className="text-sm text-slate-500 truncate block">{entry.notes}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/oncall/${entry.id}/edit`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
