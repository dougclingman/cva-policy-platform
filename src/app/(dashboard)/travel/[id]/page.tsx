import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Plane, MapPin, Calendar, Users, Mail, User, Clock,
  ShieldCheck, ShieldOff, AlertTriangle, XCircle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { TravelActions } from "@/components/travel/TravelActions";

export const metadata = { title: "Travel Exception Request" };

const statusConfig = {
  PENDING:           { label: "Pending Configuration", cls: "bg-yellow-100 text-yellow-800", icon: Clock },
  EXCEPTION_ACTIVE:  { label: "Exception Active",      cls: "bg-green-100 text-green-800",   icon: ShieldCheck },
  EXCEPTION_REMOVED: { label: "Exception Removed",     cls: "bg-slate-100 text-slate-600",   icon: ShieldOff },
  DENIED:            { label: "Denied",                 cls: "bg-red-100 text-red-700",       icon: XCircle },
} as const;

export default async function TravelDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.permissions ?? [], PERMISSIONS.TRAVEL_MANAGE)) {
    redirect("/dashboard");
  }

  const request = await prisma.travelRequest.findUnique({
    where: { id: params.id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy:  { select: { id: true, name: true, email: true } },
    },
  });

  if (!request) notFound();

  const now = new Date();
  const removalDue = request.status === "EXCEPTION_ACTIVE" && request.returnDate < now;
  const cfg = statusConfig[request.status];
  const StatusIcon = cfg.icon;

  return (
    <div>
      <Header
        title="Travel Exception Request"
        subtitle={`Submitted ${formatDate(request.createdAt)} by ${request.submittedBy.name}`}
        actions={
          <Link
            href="/travel"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Link>
        }
      />

      {removalDue && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Exception Removal Overdue</p>
            <p className="text-sm text-red-700 mt-0.5">
              The traveler&apos;s return date was {formatDate(request.returnDate)}. Please remove the O365 exception from your admin portal and mark it as removed below.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Traveler Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Traveler Information</h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-sm font-medium text-slate-900">{request.travelerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-sm text-slate-900">{request.travelerEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Plane className="h-4 w-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Travel Details</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Destination(s)</p>
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-900">{request.destinations}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Departure Date</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-sm text-slate-900">{formatDate(request.departureDate)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Return Date</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-sm text-slate-900">{formatDate(request.returnDate)}</p>
                  </div>
                </div>
              </div>
              {request.additionalTravelers && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Additional Travelers</p>
                  <div className="flex items-start gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-900 whitespace-pre-line">{request.additionalTravelers}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Notes (if present) */}
          {request.securityNotes && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Security Notes</h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-slate-700 whitespace-pre-line">{request.securityNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-slate-900">Status</h2>
            </div>
            <div className="px-6 py-5">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${cfg.cls}`}>
                <StatusIcon className="h-4 w-4" />
                {cfg.label}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-slate-900">Timeline</h2>
            </div>
            <div className="px-6 py-5">
              <ol className="relative border-l border-gray-200 space-y-4 ml-2">
                <li className="ml-4">
                  <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-white" />
                  <p className="text-xs font-semibold text-slate-700">Request Submitted</p>
                  <p className="text-xs text-slate-400">{formatDate(request.createdAt)} by {request.submittedBy.name}</p>
                </li>

                {request.exceptionConfiguredAt ? (
                  <li className="ml-4">
                    <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-700">Exception Configured</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(request.exceptionConfiguredAt)}
                      {request.reviewedBy ? ` by ${request.reviewedBy.name}` : ""}
                    </p>
                  </li>
                ) : request.status === "DENIED" ? (
                  <li className="ml-4">
                    <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-700">Request Denied</p>
                    <p className="text-xs text-slate-400">
                      {request.reviewedBy ? `by ${request.reviewedBy.name}` : ""}
                    </p>
                  </li>
                ) : (
                  <li className="ml-4 opacity-40">
                    <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-gray-300 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-500">Exception Configuration Pending</p>
                  </li>
                )}

                {request.exceptionRemovedAt ? (
                  <li className="ml-4">
                    <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-slate-500 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-700">Exception Removed</p>
                    <p className="text-xs text-slate-400">{formatDate(request.exceptionRemovedAt)}</p>
                  </li>
                ) : request.status === "EXCEPTION_ACTIVE" ? (
                  <li className="ml-4 opacity-40">
                    <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-gray-300 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-500">Exception Removal Pending</p>
                    <p className="text-xs text-slate-400">Expected after {formatDate(request.returnDate)}</p>
                  </li>
                ) : null}
              </ol>
            </div>
          </div>

          {/* Security Actions */}
          <TravelActions requestId={request.id} status={request.status} />
        </div>
      </div>
    </div>
  );
}
