"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Eye, EyeOff, Wifi } from "lucide-react";

interface MerakiConfig {
  id:        string | null;
  isEnabled: boolean;
  apiKey:    string | null;
  orgId:     string | null;
}

interface Props {
  initial: MerakiConfig;
}

export function MerakiConfigForm({ initial }: Props) {
  const router = useRouter();

  const [isEnabled,   setIsEnabled]   = useState(initial.isEnabled);
  const [apiKey,      setApiKey]      = useState(initial.apiKey ?? "");
  const [orgId,       setOrgId]       = useState(initial.orgId ?? "");
  const [showApiKey,  setShowApiKey]  = useState(false);

  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/integrations/meraki", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          apiKey: apiKey || null,
          orgId:  orgId || null,
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
      const res = await fetch("/api/admin/integrations/meraki/test", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({ ok: true, message: `Connected to ${data.orgName}` });
        // Auto-fill the org ID with the validated value from Meraki
        if (data.resolvedOrgId && data.resolvedOrgId !== orgId) {
          setOrgId(data.resolvedOrgId);
        }
      } else {
        setTestResult({ ok: false, message: data.error ?? "Connection test failed" });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="px-6 pb-6 pt-5 space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Enable Meraki Integration</p>
          <p className="text-xs text-slate-500 mt-0.5">
            When enabled, network device status is fetched from the Meraki Dashboard API.
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

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Meraki API key"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowApiKey((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Generate an API key in Meraki Dashboard → My Profile → API access.
        </p>
      </div>

      {/* Organization ID */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Organization ID
        </label>
        <input
          type="text"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          placeholder="e.g. 123456"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <p className="text-xs text-slate-400 mt-1">
          Find this in Meraki Dashboard → Organization → Settings.
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
          disabled={!apiKey}
          className="flex items-center gap-1.5"
        >
          <Wifi className="h-3.5 w-3.5" />
          Test Connection
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
