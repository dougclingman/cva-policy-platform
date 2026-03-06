"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff, XCircle } from "lucide-react";
import { TravelRequestStatus } from "@prisma/client";

interface Props {
  requestId: string;
  status:    TravelRequestStatus;
}

export function TravelActions({ requestId, status }: Props) {
  const router  = useRouter();
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function act(action: "configure" | "remove" | "deny") {
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/travel/${requestId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Action failed");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  }

  if (status === "EXCEPTION_REMOVED" || status === "DENIED") return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-slate-900">Security Actions</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {status === "PENDING"
            ? "Configure the O365 exception in your admin portal, then record it here."
            : "Remove the O365 exception in your admin portal once the traveler has returned."}
        </p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {status === "PENDING" && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Security Notes (optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record the exception ticket number, configuration details, or any relevant notes..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => act("configure")}
                disabled={!!loading}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {loading === "configure"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ShieldCheck className="h-4 w-4" />}
                {loading === "configure" ? "Saving..." : "Mark Exception Active"}
              </button>
              <button
                onClick={() => act("deny")}
                disabled={!!loading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
              >
                {loading === "deny"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <XCircle className="h-4 w-4" />}
                {loading === "deny" ? "Saving..." : "Deny Request"}
              </button>
            </div>
          </>
        )}

        {status === "EXCEPTION_ACTIVE" && (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-3">
                The exception window has passed or the traveler has returned. Remove the O365 exception from your admin portal and record it below.
              </p>
              <button
                onClick={() => act("remove")}
                disabled={!!loading}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                {loading === "remove"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ShieldOff className="h-4 w-4" />}
                {loading === "remove" ? "Saving..." : "Mark Exception Removed"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
