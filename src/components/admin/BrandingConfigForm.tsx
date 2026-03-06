"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface BrandingConfig {
  platformName: string;
  tagline:      string | null;
  logoUrl:      string | null;
  faviconUrl:   string | null;
}

interface BrandingConfigFormProps {
  initial: BrandingConfig;
}

export function BrandingConfigForm({ initial }: BrandingConfigFormProps) {
  const [platformName, setPlatformName] = useState(initial.platformName ?? "Yield");
  const [tagline,      setTagline]      = useState(initial.tagline      ?? "");
  const [logoUrl,      setLogoUrl]      = useState(initial.logoUrl      ?? "");
  const [faviconUrl,   setFaviconUrl]   = useState(initial.faviconUrl   ?? "");
  const [saving,       setSaving]       = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: platformName.trim(),
          tagline:      tagline.trim()    || null,
          logoUrl:      logoUrl.trim()    || null,
          faviconUrl:   faviconUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save branding config");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  const effectiveLogo      = logoUrl.trim()      || null;
  const effectiveName      = platformName.trim() || "Yield";
  const effectiveTagline   = tagline.trim()      || "Cooperative innovation, delivered.";

  return (
    <div className="space-y-8">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Branding settings saved successfully.
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Platform Identity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Platform Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Yield"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Shown in the sidebar and login page.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Cooperative innovation, delivered."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Shown below the platform name on the login page.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Logo & Favicon
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png or /uploads/logo.png"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Displayed in the sidebar and login page. Leave blank to use the default icon.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Favicon URL
                </label>
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://example.com/favicon.ico or /favicon.ico"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Browser tab icon. Optional.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save Branding"}
          </button>
        </div>
      </form>

      {/* Preview section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Preview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Sidebar preview */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Sidebar Logo</p>
            <div className="bg-slate-900 rounded-xl px-4 py-3 inline-flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 flex-shrink-0">
                {effectiveLogo ? (
                  <img
                    src={effectiveLogo}
                    alt={effectiveName}
                    className="h-8 w-8 rounded-lg object-contain"
                  />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-white">{effectiveName}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">IT Platform</div>
              </div>
            </div>
          </div>

          {/* Login preview */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Login Page Header</p>
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl px-6 py-5 text-white text-center inline-flex flex-col items-center min-w-[200px]">
              <div className="bg-white/20 rounded-full p-3 mb-3">
                {effectiveLogo ? (
                  <img
                    src={effectiveLogo}
                    alt={effectiveName}
                    className="w-8 h-8 rounded object-contain"
                  />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="text-lg font-bold tracking-tight">{effectiveName}</div>
              <p className="text-blue-100 text-xs mt-1">{effectiveTagline}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
