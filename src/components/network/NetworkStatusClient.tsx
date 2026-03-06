"use client";

import { useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NetworkMapPanel } from "./NetworkMapPanel";
import type { MappedDevice } from "./NetworkMap";

type ProblemDevice = {
  serial:         string;
  name:           string;
  productType:    string;
  model:          string;
  status:         "online" | "offline" | "alerting" | "dormant";
  lastReportedAt: string | null;
  lanIp?:         string;
};

const PRODUCT_LABELS: Record<string, string> = {
  wireless:        "Wireless AP",
  appliance:       "Firewall/Router",
  switch:          "Switch",
  camera:          "Camera",
  cellularGateway: "Cellular Gateway",
  sensor:          "Sensor",
};

const STATUS_STYLES: Record<string, string> = {
  offline:  "bg-red-100 text-red-700",
  alerting: "bg-amber-100 text-amber-700",
  dormant:  "bg-gray-100 text-gray-600",
};

interface Props {
  problemDevices: ProblemDevice[];
  mappedDevices:  MappedDevice[];
}

export function NetworkStatusClient({ problemDevices, mappedDevices }: Props) {
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);

  function handleRowClick(serial: string) {
    // Toggle: clicking the same row again clears selection
    setSelectedSerial((prev) => (prev === serial ? null : serial));
  }

  // Check if a problem device has map coordinates
  const mappedSerials = new Set(mappedDevices.map((d) => d.serial));

  return (
    <>
      {/* Device Map — always rendered so it can receive flyToSerial */}
      <NetworkMapPanel devices={mappedDevices} flyToSerial={selectedSerial} />

      {/* Offline & Alerting section */}
      {problemDevices.length > 0 && (
        <div className="rounded-xl border-2 border-red-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-red-100 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="font-semibold text-red-800">Offline &amp; Alerting Devices</h2>
            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5">
              {problemDevices.length}
            </span>
            {selectedSerial && (
              <button
                type="button"
                onClick={() => setSelectedSerial(null)}
                className="ml-2 text-xs text-red-600 underline hover:text-red-800"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  {["Name", "Type", "Model", "Status", "Last Seen", "LAN IP", ""].map((h) => (
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
                {problemDevices.map((device) => {
                  const isSelected = selectedSerial === device.serial;
                  const hasPinned  = mappedSerials.has(device.serial);
                  return (
                    <tr
                      key={device.serial}
                      onClick={() => handleRowClick(device.serial)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {device.name || device.serial}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {PRODUCT_LABELS[device.productType] ?? device.productType}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{device.model}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[device.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {device.lastReportedAt
                          ? formatDistanceToNow(new Date(device.lastReportedAt), { addSuffix: true })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                        {device.lanIp ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {hasPinned && (
                          <span
                            title="Click row to show on map"
                            className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
                              isSelected
                                ? "bg-blue-200 text-blue-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <MapPin className="h-3 w-3" />
                            {isSelected ? "Zoomed" : "Map"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2 text-xs text-slate-400 border-t border-gray-50">
            Click a row to zoom the map to that device.
          </p>
        </div>
      )}
    </>
  );
}
