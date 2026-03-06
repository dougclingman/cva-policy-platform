"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";

type State = "idle" | "loading" | "subscribed" | "denied" | "unsupported" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from(raw.split("").map((c) => c.charCodeAt(0)));
}

export function NetworkAlertSettings() {
  const [state,       setState]       = useState<State>("loading");
  const [checking,    setChecking]    = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  // On mount: register SW, determine current subscription state
  useEffect(() => {
    async function init() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }

      try {
        // Register service worker
        await navigator.serviceWorker.register("/sw.js");

        // Check server-side if this user has any subscription
        const serverRes = await fetch("/api/push/subscribe");
        const { subscribed } = await serverRes.json();

        const permission = Notification.permission;
        if (permission === "denied") { setState("denied"); return; }
        if (subscribed && permission === "granted") { setState("subscribed"); return; }
        setState("idle");
      } catch {
        setState("error");
      }
    }
    init();
  }, []);

  async function subscribe() {
    setState("loading");
    try {
      const keyRes    = await fetch("/api/push/vapid-key");
      const { publicKey } = await keyRes.json();

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }

      const reg  = await navigator.serviceWorker.ready;
      const sub  = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint:  subJson.endpoint,
          keys:      subJson.keys,
          userAgent: navigator.userAgent.slice(0, 200),
        }),
      });

      setState("subscribed");
    } catch {
      setState("error");
    }
  }

  async function unsubscribe() {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("idle");
    } catch {
      setState("error");
    }
  }

  async function checkNow() {
    setChecking(true);
    setCheckResult(null);
    try {
      const res  = await fetch("/api/network/alerts", { method: "POST" });
      const data = await res.json();
      if (data.newOutages > 0) {
        setCheckResult(`${data.newOutages} new outage${data.newOutages > 1 ? "s" : ""} detected — push sent to ${data.sent} device${data.sent !== 1 ? "s" : ""}.`);
      } else if (data.totalOffline > 0) {
        setCheckResult(`${data.totalOffline} device${data.totalOffline > 1 ? "s" : ""} offline — no new outages since last check.`);
      } else {
        setCheckResult("All devices online — no alerts needed.");
      }
    } catch {
      setCheckResult("Check failed — unable to reach Meraki API.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <BellRing className="h-4 w-4 text-slate-400" />
        <h2 className="font-semibold text-slate-900">Outage Alerts</h2>
        <span className="text-xs text-slate-400 ml-1">· Browser push notifications</span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Subscription status + toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {state === "unsupported" && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                Push notifications are not supported in this browser.
              </div>
            )}
            {state === "denied" && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Notifications blocked — enable them in your browser settings.
              </div>
            )}
            {state === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Something went wrong. Please try again.
              </div>
            )}
            {state === "loading" && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}
            {state === "idle" && (
              <p className="text-sm text-slate-600">
                Receive a push notification when a network device goes offline.
                Works on mobile and desktop.
              </p>
            )}
            {state === "subscribed" && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  <span className="font-medium">Notifications enabled</span> — you&apos;ll be alerted when new devices go offline.
                </span>
              </div>
            )}
          </div>

          {/* Action button */}
          {state === "idle" && (
            <button
              type="button"
              onClick={subscribe}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Bell className="h-3.5 w-3.5" />
              Enable Alerts
            </button>
          )}
          {state === "subscribed" && (
            <button
              type="button"
              onClick={unsubscribe}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
            >
              <BellOff className="h-3.5 w-3.5" />
              Disable
            </button>
          )}
        </div>

        {/* Manual check + send button */}
        {state === "subscribed" && (
          <div className="flex items-center gap-3 pt-1 border-t border-gray-50">
            <button
              type="button"
              onClick={checkNow}
              disabled={checking}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {checking
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              Check for Outages Now
            </button>
            {checkResult && (
              <p className="text-xs text-slate-500">{checkResult}</p>
            )}
          </div>
        )}

        <p className="text-xs text-slate-400">
          Alerts fire automatically when new devices are detected as offline compared to the last check.
          On mobile, add this page to your home screen for best notification support.
        </p>
      </div>
    </div>
  );
}
