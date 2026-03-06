"use client";

import { useState } from "react";
import { CheckCircle2, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  policyId: string;
  alreadyAcknowledged: boolean;
  acknowledgedAt: string | null;
  canRequestAcknowledgment: boolean;
  acknowledgmentDeadline: string | null;
  showRequestOnly?: boolean;
}

export function AcknowledgmentSection({
  policyId,
  alreadyAcknowledged: initialAcknowledged,
  acknowledgedAt: initialAcknowledgedAt,
  canRequestAcknowledgment,
  acknowledgmentDeadline,
  showRequestOnly = false,
}: Props) {
  const [acknowledged, setAcknowledged] = useState(initialAcknowledged);
  const [acknowledgedAt, setAcknowledgedAt] = useState(initialAcknowledgedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deadline, setDeadline] = useState(
    acknowledgmentDeadline ? acknowledgmentDeadline.slice(0, 10) : ""
  );
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  async function handleAcknowledge() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/policies/${policyId}/acknowledge`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to acknowledge");
        return;
      }
      const data = await res.json();
      setAcknowledged(true);
      setAcknowledgedAt(data.acknowledgedAt);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAcknowledgment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_acknowledgment",
          acknowledgmentDeadline: deadline || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send acknowledgment request");
        return;
      }
      setRequestSent(true);
      setShowRequestForm(false);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (showRequestOnly) {
    return (
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Request Team Acknowledgment</h2>
        </div>
        <div className="p-6">
          {requestSent ? (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="h-5 w-5" />
              Acknowledgment request sent to all active users.
            </div>
          ) : showRequestForm ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Push this policy out for acknowledgment. All active users will be required to acknowledge they have read it.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> Acknowledgment Deadline (optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleRequestAcknowledgment} loading={loading}>
                  Send to Department
                </Button>
                <Button variant="secondary" onClick={() => setShowRequestForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Require all users to acknowledge they have read this policy.</p>
              <Button variant="secondary" onClick={() => setShowRequestForm(true)}>
                Request Acknowledgment
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-slate-500" />
        <h2 className="font-semibold text-slate-900">Policy Acknowledgment</h2>
      </div>
      <div className="p-6">
        {acknowledged ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">You have acknowledged this policy.</p>
              {acknowledgedAt && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Acknowledged on {new Date(acknowledgedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              By clicking the button below, you confirm that you have read, understood, and agree to comply with this policy.
              {acknowledgmentDeadline && (
                <div className="mt-1 font-medium">
                  Please acknowledge by {new Date(acknowledgmentDeadline).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleAcknowledge} loading={loading}>
              I have read and understood this policy
            </Button>
          </div>
        )}

        {canRequestAcknowledgment && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {requestSent ? (
              <p className="text-sm text-green-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Acknowledgment request updated.
              </p>
            ) : showRequestForm ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 font-medium">Update Acknowledgment Deadline</p>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleRequestAcknowledgment} loading={loading}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowRequestForm(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRequestForm(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Edit deadline
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
