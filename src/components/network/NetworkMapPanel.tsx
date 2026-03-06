"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Map, X } from "lucide-react";
import type { MappedDevice } from "./NetworkMap";

const NetworkMap = dynamic(
  () => import("./NetworkMap").then((m) => m.NetworkMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        Loading map…
      </div>
    ),
  }
);

interface Props {
  devices:      MappedDevice[];
  flyToSerial?: string | null;
}

export function NetworkMapPanel({ devices, flyToSerial }: Props) {
  const [open, setOpen] = useState(false);

  // Auto-open the map whenever a device is selected from the table
  useEffect(() => {
    if (flyToSerial) setOpen(true);
  }, [flyToSerial]);

  const mappedCount = devices.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Device Map</h2>
          {mappedCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5">
              {mappedCount} located
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          {open ? (
            <><X className="h-3.5 w-3.5" /> Hide Map</>
          ) : (
            <><Map className="h-3.5 w-3.5" /> Show Map</>
          )}
        </button>
      </div>

      {open && (
        mappedCount === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            No devices have location coordinates set in Meraki Dashboard.
            <br />
            <span className="text-xs mt-1 block">
              Set lat/lng in Meraki Dashboard → Network → Devices → Edit device to enable map view.
            </span>
          </div>
        ) : (
          <NetworkMap devices={devices} flyToSerial={flyToSerial} />
        )
      )}
    </div>
  );
}
