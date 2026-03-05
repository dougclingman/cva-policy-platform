"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Info, CheckCircle } from "lucide-react";

interface SSOConfig {
  id?: string;
  provider: string;
  isEnabled: boolean;
  entityId?: string | null;
  ssoUrl?: string | null;
  certificate?: string | null;
  defaultRoleId?: string | null;
}
interface Role { id: string; name: string }

interface Props { config: SSOConfig | null; roles: Role[] }

export function SSOConfigForm({ config, roles }: Props) {
  const router     = useRouter();
  const [provider,       setProvider]       = useState(config?.provider ?? "saml");
  const [isEnabled,      setIsEnabled]      = useState(config?.isEnabled ?? false);
  const [entityId,       setEntityId]       = useState(config?.entityId ?? "");
  const [ssoUrl,         setSsoUrl]         = useState(config?.ssoUrl ?? "");
  const [certificate,    setCertificate]    = useState(config?.certificate ?? "");
  const [defaultRoleId,  setDefaultRoleId]  = useState(config?.defaultRoleId ?? "");
  const [loading,        setLoading]        = useState(false);
  const [saved,          setSaved]          = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await fetch("/api/admin/sso", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, isEnabled, entityId, ssoUrl, certificate, defaultRoleId }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${isEnabled ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
        <Info className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isEnabled ? "text-green-600" : "text-amber-600"}`} />
        <div>
          <p className={`text-sm font-medium ${isEnabled ? "text-green-800" : "text-amber-800"}`}>
            {isEnabled ? "SSO is enabled" : "SSO is not enabled"}
          </p>
          <p className={`text-xs mt-0.5 ${isEnabled ? "text-green-600" : "text-amber-600"}`}>
            {isEnabled
              ? "Users can sign in using your identity provider."
              : "Configure the settings below and enable SSO when ready. Credentials login remains available."}
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={isEnabled ? "published" : "warning"}>
            {isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </div>

      {/* Provider Type */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-slate-900">Provider Settings</h3>

        <div className="flex gap-4">
          {["saml", "oidc"].map((p) => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="provider"
                value={p}
                checked={provider === p}
                onChange={() => setProvider(p)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                {p === "saml" ? "SAML 2.0" : "OIDC / OAuth 2.0"}
              </span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {provider === "saml" ? "SP Entity ID / Issuer" : "Client ID"}
          </label>
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder={provider === "saml" ? "https://cva.internal/saml/metadata" : "your-client-id"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {provider === "saml" ? "IdP SSO URL" : "Authorization Endpoint"}
          </label>
          <input
            type="url"
            value={ssoUrl}
            onChange={(e) => setSsoUrl(e.target.value)}
            placeholder={provider === "saml" ? "https://idp.example.com/sso/saml" : "https://idp.example.com/oauth/authorize"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {provider === "saml" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">IdP Certificate (PEM)</label>
            <textarea
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
              rows={5}
              placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono resize-y"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Default Role for New SSO Users
          </label>
          <select
            value={defaultRoleId}
            onChange={(e) => setDefaultRoleId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-slate-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">— None (manual assignment required) —</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1">
            New users who sign in via SSO will be assigned this role automatically.
          </p>
        </div>
      </div>

      {/* Enable / Disable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Enable SSO</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Allow users to authenticate via your identity provider
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
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
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

      {/* Implementation Note */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-800 mb-1">Implementation Note</p>
        <p className="text-xs text-blue-700">
          SAML/OIDC provider integration requires installing additional dependencies
          (<code className="font-mono">@auth/core</code>, <code className="font-mono">passport-saml</code>, etc.)
          and configuring the NextAuth.js provider. This form stores the configuration
          ready for your IT team to complete the integration.
        </p>
      </div>
    </form>
  );
}
