"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Globe, Archive } from "lucide-react";

interface Props {
  policyId: string;
  status: string;
  canReview: boolean;
  canPublish: boolean;
}

export function PolicyReviewActions({ policyId, status, canReview, canPublish }: Props) {
  const router    = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  async function performAction(action: string) {
    setLoading(action);
    try {
      const res = await fetch(`/api/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      if (!res.ok) throw new Error("Action failed");
      router.refresh();
    } finally {
      setLoading(null);
      setComment("");
    }
  }

  return (
    <div className="space-y-3">
      {canReview && status === "UNDER_REVIEW" && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional review comments..."
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => performAction("approve")}
              loading={loading === "approve"}
              className="bg-green-600 hover:bg-green-700 border-transparent text-white"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => performAction("reject")}
              loading={loading === "reject"}
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        </>
      )}

      {canPublish && (
        <div className="flex gap-2 flex-wrap">
          {status === "DRAFT" && (
            <Button size="sm" variant="secondary" onClick={() => performAction("submit_review")} loading={loading === "submit_review"}>
              Submit for Review
            </Button>
          )}
          {(status === "UNDER_REVIEW" || status === "DRAFT") && (
            <Button size="sm" onClick={() => performAction("publish")} loading={loading === "publish"}>
              <Globe className="h-3.5 w-3.5" /> Publish
            </Button>
          )}
          {status === "PUBLISHED" && (
            <Button size="sm" variant="secondary" onClick={() => performAction("archive")} loading={loading === "archive"}>
              <Archive className="h-3.5 w-3.5" /> Archive
            </Button>
          )}
          {status === "ARCHIVED" && (
            <Button size="sm" variant="secondary" onClick={() => performAction("publish")} loading={loading === "publish"}>
              <Globe className="h-3.5 w-3.5" /> Re-publish
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
