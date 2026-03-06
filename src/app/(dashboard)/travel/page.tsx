import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plane, Plus, Clock, AlertTriangle, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

export const metadata = { title: "Travel Exceptions" };

const statusConfig = {
  PENDING:           { label: "Pending",            cls: "bg-yellow-100 text-yellow-800" },
  EXCEPTION_ACTIVE:  { label: "Exception Active",   cls: "bg-green-100 text-green-800"  },
  EXCEPTION_REMOVED: { label: "Exception Removed",  cls: "bg-slate-100 text-slate-600"  },
  DENIED:            { label: "Denied",              cls: "bg-red-100 text-red-700"      },
} as const;

export default async function TravelPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.TRAVEL_MANAGE)) {
    redirect("/dashboard");
  }

  const requests = await prisma.travelRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: { select: { name: true } },
      reviewedBy:  { select: { name: true } },
    },
  });

  const now = new Date();

  return (
    <div>
      <Header
        title="Travel Exceptions"
        subtitle="Manage international travel O365 remote-access exception requests"
        actions={
          <Link
            href="/travel/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        }
      />

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 mt-4">
          <Plane className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No travel exception requests yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Submit a request when a team member needs international O365 access.
          </p>
        </div>
      ) : (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Traveler</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Destinations</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted By</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => {
                const cfg = statusConfig[req.status];
                const removalDue = req.status === "EXCEPTION_ACTIVE" && req.returnDate < now;
                return (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{req.travelerName}</p>
                      <p className="text-xs text-slate-400">{req.travelerEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 max-w-xs truncate">{req.destinations}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{formatDate(req.departureDate)} – {formatDate(req.returnDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                        {removalDue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Removal Due
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{req.submittedBy.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(req.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/travel/${req.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
