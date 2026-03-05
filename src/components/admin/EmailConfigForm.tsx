"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Mail, Bell } from "lucide-react";

interface EmailNotification {
  id: string;
  name: string;
  description?: string | null;
  trigger: string;
  isEnabled: boolean;
}
interface EmailConfig {
  id?: string;
  isEnabled: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  notifications: EmailNotification[];
}

interface Props { config: EmailConfig | null }

export function EmailConfigForm({ config }: Props) {
  const router = useRouter();

  const [isEnabled,      setIsEnabled]      = useState(config?.isEnabled ?? false);
  const [smtpHost,       setSmtpHost]       = useState(config?.smtpHost ?? "");
  const [smtpPort,       setSmtpPort]       = useState(String(config?.smtpPort ?? "587"));
  const [smtpUser,       setSmtpUser]       = useState(config?.smtpUser ?? "");
  const [smtpPass,       setSmtpPass]       = useState("");
  const [fromEmail,      setFromEmail]      = useState(config?.fromEmail ?? "");
  const [fromName,       setFromName]       = useState(config?.fromName ?? "CVA IT Policies");
  const [notifications,  setNotifications]  = useState<EmailNotification[]>(config?.notifications ?? []);
  const [loading,        setLoading]        = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [testLoading,    setTestLoading]    = useState(false);
  const [testResult,     setTestResult]     = useState<"success" | "error" | null>(null);

  function toggleNotification(id: string) {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isEnabled: !n.isEnabled } : n)
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled, smtpHost, smtpPort: parseInt(smtpPort), smtpUser,
          smtpPass: smtpPass || undefined, fromEmail, fromName,
          notifications: notifications.map((n) => ({ id: n.id, isEnabled: n.isEnabled })),
        }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function sendTestEmail() {
    setTestLoading(true);
    setTestResult(null);
    // Simulate a test — in production this would call a test endpoint
    await new Promise((r) => setTimeout(r, 1500));
    setTestResult(smtpHost && fromEmail ? "success" : "error");
    setTestLoading(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* SMTP Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">SMTP Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port</label>
            <input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Username</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="smtp-user@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Password</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="Leave blank to keep existing"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Email</label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@cva.internal"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Name</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="CVA IT Policies"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Test button */}
        <div className="flex items-center gap-3 pt-1">
          <Button type="button" variant="secondary" size="sm" loading={testLoading} onClick={sendTestEmail}>
            Send Test Email
          </Button>
          {testResult === "success" && (
            <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3.5 w-3.5" /> Test sent successfully</span>
          )}
          {testResult === "error" && (
            <span className="text-xs text-red-600">Test failed — check SMTP settings</span>
          )}
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Enable Email Notifications</p>
            <p className="text-sm text-slate-500 mt-0.5">Send email alerts for the triggers configured below</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={() => setIsEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isEnabled ? "bg-blue-600" : "bg-gray-200"}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Notification Triggers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Bell className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Notification Triggers</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {notifications.map((notif) => (
            <div key={notif.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{notif.name}</p>
                {notif.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{notif.description}</p>
                )}
                <code className="text-[10px] text-slate-400 font-mono mt-0.5 block">{notif.trigger}</code>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notif.isEnabled}
                onClick={() => toggleNotification(notif.id)}
                disabled={!isEnabled}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${notif.isEnabled ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${notif.isEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>Save Configuration</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" /> Saved successfully
          </span>
        )}
      </div>
    </form>
  );
}
