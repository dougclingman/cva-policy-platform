"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";

interface ReportConfig {
  id: string;
  interval: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  dueDayOfWeek: number;
  reminderDays: number;
  isEnabled: boolean;
}

interface Props {
  config: ReportConfig | null;
}

const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export function ReportConfigForm({ config }: Props) {
  const router = useRouter();

  const [interval,      setInterval]      = useState<string>(config?.interval      ?? "WEEKLY");
  const [dueDayOfWeek,  setDueDayOfWeek]  = useState<number>(config?.dueDayOfWeek  ?? 5);
  const [reminderDays,  setReminderDays]  = useState<number>(config?.reminderDays  ?? 1);
  const [isEnabled,     setIsEnabled]     = useState<boolean>(config?.isEnabled    ?? true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/report-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, dueDayOfWeek, reminderDays, isEnabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save configuration");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reporting Interval
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        {/* Due Day */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reports Due On
          </label>
          <select
            value={dueDayOfWeek}
            onChange={(e) => setDueDayOfWeek(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {DAY_NAMES[d]}
              </option>
            ))}
          </select>
        </div>

        {/* Reminder Days */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reminder Days Before Due
          </label>
          <input
            type="number"
            min={0}
            max={14}
            value={reminderDays}
            onChange={(e) => setReminderDays(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Send reminder this many days before the due date
          </p>
        </div>

        {/* Enable Toggle */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Enable Reports</p>
              <p className="text-xs text-slate-400 mt-0.5">Allow staff to submit reports</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={() => setIsEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isEnabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  isEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save Configuration"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" /> Saved successfully
          </span>
        )}
      </div>
    </form>
  );
}
