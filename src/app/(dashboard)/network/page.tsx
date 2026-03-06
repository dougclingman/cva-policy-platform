import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Wifi, WifiOff, AlertTriangle, Monitor, CheckCircle2 } from "lucide-react";
import { NetworkStatusClient } from "@/components/network/NetworkStatusClient";
import { NetworkAlertSettings } from "@/components/network/NetworkAlertSettings";
import type { MappedDevice } from "@/components/network/NetworkMap";

export const metadata = { title: "Network Status" };

type MerakiDevice = {
  name: string;
  serial: string;
  mac: string;
  networkId: string;
  productType: string;
  model: string;
  status: "online" | "offline" | "alerting" | "dormant";
  lastReportedAt: string | null;
  lanIp?: string;
};

type MerakiDeviceDetail = {
  serial: string;
  lat?: number;
  lng?: number;
  address?: string;
};

function productTypeLabel(productType: string): string {
  const labels: Record<string, string> = {
    wireless: "Wireless AP",
    appliance: "Firewall/Router",
    switch: "Switch",
    camera: "Camera",
    cellularGateway: "Cellular Gateway",
    sensor: "Sensor",
  };
  return labels[productType] ?? productType;
}

function StatusBadge({ status }: { status: MerakiDevice["status"] }) {
  const styles: Record<string, string> = {
    online: "bg-green-100 text-green-700",
    offline: "bg-red-100 text-red-700",
    alerting: "bg-amber-100 text-amber-700",
    dormant: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DeviceTable({ devices }: { devices: MerakiDevice[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr>
            {["Name", "Type", "Model", "Status", "Last Seen", "LAN IP"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {devices.map((device) => (
            <tr key={device.serial} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{device.name}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{productTypeLabel(device.productType)}</td>
              <td className="px-4 py-3 text-sm text-slate-600 font-mono">{device.model}</td>
              <td className="px-4 py-3">
                <StatusBadge status={device.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {device.lastReportedAt
                  ? formatDistanceToNow(new Date(device.lastReportedAt), { addSuffix: true })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                {device.lanIp ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function NetworkStatusPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/dashboard");

  const permissions = session.user.permissions ?? [];
  const isAdmin = hasPermission(permissions, PERMISSIONS.ADMIN_VIEW);

  const merakiConfig = await prisma.merakiConfig.findFirst();
  let devices: MerakiDevice[] = [];
  let mappedDevices: MappedDevice[] = [];
  let error: string | null = null;
  let configured = false;

  if (merakiConfig?.isEnabled && merakiConfig.apiKey) {
    configured = true;
    try {
      // Resolve the real org ID dynamically
      const orgsRes = await fetch("https://api.meraki.com/api/v1/organizations", {
        headers: { "X-Cisco-Meraki-API-Key": merakiConfig.apiKey },
        next: { revalidate: 300 },
      });

      if (!orgsRes.ok) {
        error = `Meraki API error ${orgsRes.status} — check your API key`;
      } else {
        const orgs: Array<{ id: string; name: string }> = await orgsRes.json();
        const matched = merakiConfig.orgId
          ? orgs.find((o) => o.id === merakiConfig.orgId)
          : orgs[0];
        const org = matched ?? orgs[0];

        if (!org) {
          error = "No organizations found for this API key";
        } else {
          // Fetch device statuses + device details (lat/lng) in parallel
          const [statusRes, detailRes] = await Promise.all([
            fetch(
              `https://api.meraki.com/api/v1/organizations/${org.id}/devices/statuses`,
              {
                headers: { "X-Cisco-Meraki-API-Key": merakiConfig.apiKey },
                next: { revalidate: 60 },
              }
            ),
            fetch(
              `https://api.meraki.com/api/v1/organizations/${org.id}/devices`,
              {
                headers: { "X-Cisco-Meraki-API-Key": merakiConfig.apiKey },
                next: { revalidate: 300 },
              }
            ),
          ]);

          if (statusRes.ok) {
            devices = await statusRes.json();
          } else {
            error = `Meraki API returned ${statusRes.status}`;
          }

          // Merge lat/lng into devices for the map
          if (detailRes.ok) {
            const details: MerakiDeviceDetail[] = await detailRes.json();
            const detailMap = new Map(details.map((d) => [d.serial, d]));

            mappedDevices = devices
              .map((d) => {
                const loc = detailMap.get(d.serial);
                return { ...d, lat: loc?.lat, lng: loc?.lng, address: loc?.address };
              })
              .filter((d) =>
                typeof d.lat === "number" && typeof d.lng === "number" &&
                isFinite(d.lat) && isFinite(d.lng) &&
                d.lat !== 0 && d.lng !== 0
              ) as MappedDevice[];
          }
        }
      }
    } catch {
      error = "Failed to reach Meraki API";
    }
  }

  const totalCount    = devices.length;
  const onlineCount   = devices.filter((d) => d.status === "online").length;
  const offlineCount  = devices.filter((d) => d.status === "offline").length;
  const alertingCount = devices.filter((d) => d.status === "alerting" || d.status === "dormant").length;

  const problemDevices = devices.filter((d) => d.status !== "online");
  const loadedAt = new Date().toLocaleTimeString();

  return (
    <div className="space-y-8">
      <Header
        title="Network Status"
        subtitle="Live device status from Cisco Meraki"
        actions={
          isAdmin ? (
            <Link
              href="/admin/integrations"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Configure →
            </Link>
          ) : undefined
        }
      />

      {/* Not configured state */}
      {!configured && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Wifi className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                Meraki integration is not configured
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Go to Admin &rarr; Integrations to set up your API key and enable network monitoring.
              </p>
              <Link
                href="/admin/integrations"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Go to Integrations →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {configured && error && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Summary stat row */}
      {configured && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="inline-flex rounded-lg bg-slate-100 p-2 mb-3">
                <Monitor className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Total Devices</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="inline-flex rounded-lg bg-green-50 p-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-700">{onlineCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Online</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="inline-flex rounded-lg bg-red-50 p-2 mb-3">
                <WifiOff className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{offlineCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Offline</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="inline-flex rounded-lg bg-amber-50 p-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{alertingCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Alerting / Dormant</div>
            </div>
          </div>

          {/* Interactive map + offline table (client component) */}
          <NetworkStatusClient
            problemDevices={problemDevices}
            mappedDevices={mappedDevices}
          />

          {/* All Devices section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <Monitor className="h-4 w-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">All Devices</h2>
              {totalCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5">
                  {totalCount}
                </span>
              )}
            </div>
            {devices.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400">
                No devices found in your Meraki organization.
              </div>
            ) : (
              <DeviceTable devices={devices} />
            )}
          </div>

          {/* Auto-refresh note */}
          <p className="text-center text-xs text-slate-400">
            Data refreshed every 60 seconds. Last loaded: {loadedAt}
          </p>

          {/* Outage alert opt-in */}
          <NetworkAlertSettings />
        </>
      )}
    </div>
  );
}
