"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Copy, Check, Send } from "lucide-react";

interface TeamsConfig {
  id:                 string | null;
  isEnabled:          boolean;
  incomingWebhookUrl: string | null;
  verificationToken:  string | null;
  channelName:        string | null;
}

interface Props {
  config:          TeamsConfig;
  webhookEndpoint: string;
}

export function TeamsConfigForm({ config, webhookEndpoint }: Props) {
  const router = useRouter();

  const [isEnabled,          setIsEnabled]          = useState(config.isEnabled);
  const [incomingWebhookUrl, setIncomingWebhookUrl] = useState(config.incomingWebhookUrl ?? "");
  const [verificationToken,  setVerificationToken]  = useState(config.verificationToken ?? "");
  const [channelName,        setChannelName]        = useState(config.channelName ?? "");

  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [testing,     setTesting]     = useState(false);
  const [testResult,  setTestResult]  = useState<{ ok: boolean; message: string } | null>(null);

  const [copied, setCopied] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/integrations/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          incomingWebhookUrl: incomingWebhookUrl || null,
          verificationToken:  verificationToken || null,
          channelName:        channelName || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to save");
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/integrations/teams/test", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setTestResult({ ok: true, message: data.message ?? "Test message sent!" });
      } else {
        setTestResult({ ok: false, message: data.error ?? "Test failed" });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error" });
    } finally {
      setTesting(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(webhookEndpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <form onSubmit={handleSave} className="px-6 pb-6 pt-5 space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Enable Teams Integration</p>
          <p className="text-xs text-slate-500 mt-0.5">
            When enabled, platform messages are forwarded to Teams and vice versa.
          </p>
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

      {/* Channel name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Channel Name
        </label>
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="e.g. it-platform-chat"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <p className="text-xs text-slate-400 mt-1">
          Display name of the Teams channel (shown in the platform chat UI).
        </p>
      </div>

      {/* Incoming Webhook URL */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Incoming Webhook URL
        </label>
        <input
          type="url"
          value={incomingWebhookUrl}
          onChange={(e) => setIncomingWebhookUrl(e.target.value)}
          placeholder="https://your-org.webhook.office.com/..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <p className="text-xs text-slate-400 mt-1">
          Paste the Incoming Webhook URL from your Teams channel → Connectors → Incoming Webhook.
          Messages posted on this platform will be forwarded to that channel.
        </p>
      </div>

      {/* Verification Token */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Verification Token (HMAC secret)
        </label>
        <input
          type="password"
          value={verificationToken}
          onChange={(e) => setVerificationToken(e.target.value)}
          placeholder="Base64-encoded secret"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
          autoComplete="off"
        />
        <p className="text-xs text-slate-400 mt-1">
          Generated when registering an Outgoing Webhook in Teams admin center. Used to validate
          incoming webhook requests via HMAC-SHA256.
        </p>
      </div>

      {/* Webhook endpoint with copy button */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Your Outgoing Webhook Endpoint
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-mono text-slate-700 break-all">
            {webhookEndpoint}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy to clipboard"
            className="flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2.5 text-slate-500 hover:text-slate-700 hover:border-gray-300 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Register this URL in Teams as an Outgoing Webhook so that Teams messages are forwarded to this platform.
        </p>
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            testResult.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {testResult.ok ? (
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={saving}>
          Save Configuration
        </Button>

        <Button
          type="button"
          variant="secondary"
          loading={testing}
          onClick={handleTest}
          disabled={!incomingWebhookUrl}
          className="flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          Send Test Message
        </Button>

        {saved && !saving && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
