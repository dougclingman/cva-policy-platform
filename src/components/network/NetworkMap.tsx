"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";

export type MappedDevice = {
  serial: string;
  name: string;
  productType: string;
  model: string;
  status: "online" | "offline" | "alerting" | "dormant";
  lastReportedAt: string | null;
  lanIp?: string;
  lat: number;
  lng: number;
  address?: string;
};

// Wong / IBM colorblind-safe palette — distinguishable for deuteranopia, protanopia, tritanopia
export const STATUS_COLORS: Record<string, string> = {
  online:   "#0077BB", // blue
  offline:  "#CC3311", // vermillion (orange-red)
  alerting: "#EE7733", // orange
  dormant:  "#BBBBBB", // gray
};

// Shape SVGs — shape + color gives dual encoding so colorblind users can identify by shape alone
function buildIcon(status: string, selected = false): L.DivIcon {
  const color = STATUS_COLORS[status] ?? "#BBBBBB";
  const size  = selected ? 28 : 20;
  const half  = size / 2;
  const pulse = selected
    ? `box-shadow:0 0 0 6px ${color}44, 0 2px 10px rgba(0,0,0,0.5);animation:pulse-ring 1.4s ease-out infinite;`
    : "box-shadow:0 1px 5px rgba(0,0,0,0.45);";

  let shapeInner: string;
  if (status === "offline") {
    // Diamond (rotated square)
    const sq = Math.round(size * 0.55);
    shapeInner = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect x="${half - sq / 2}" y="${half - sq / 2}" width="${sq}" height="${sq}"
          rx="2" fill="${color}" stroke="white" stroke-width="2.5"
          transform="rotate(45 ${half} ${half})"/>
      </svg>`;
  } else if (status === "alerting") {
    // Triangle
    const pad = 2;
    shapeInner = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <polygon points="${half},${pad} ${size - pad},${size - pad} ${pad},${size - pad}"
          fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/>
      </svg>`;
  } else if (status === "dormant") {
    // Small hollow circle
    const r = Math.round(size * 0.3);
    shapeInner = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${half}" cy="${half}" r="${r}" fill="${color}" stroke="white" stroke-width="2.5" stroke-dasharray="3 2"/>
      </svg>`;
  } else {
    // Circle (online)
    const r = Math.round(size * 0.4);
    shapeInner = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${half}" cy="${half}" r="${r}" fill="${color}" stroke="white" stroke-width="2.5"/>
      </svg>`;
  }

  const html = `<div style="width:${size}px;height:${size}px;border-radius:${status === "offline" ? "0" : "50%"};${pulse}display:flex;align-items:center;justify-content:center;">${shapeInner}</div>`;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [half, half], popupAnchor: [0, -(half + 4)] });
}

const PRODUCT_LABELS: Record<string, string> = {
  wireless:        "Wireless AP",
  appliance:       "Firewall/Router",
  switch:          "Switch",
  camera:          "Camera",
  cellularGateway: "Cellular Gateway",
  sensor:          "Sensor",
};

function productLabel(t: string) { return PRODUCT_LABELS[t] ?? t; }

function timeAgo(ts: string | null) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AutoFit({ devices }: { devices: MappedDevice[] }) {
  const map = useMap();
  useEffect(() => {
    if (devices.length === 0) return;
    if (devices.length === 1) { map.setView([devices[0].lat, devices[0].lng], 13); return; }
    map.fitBounds(L.latLngBounds(devices.map((d) => [d.lat, d.lng])), { padding: [40, 40] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function MapController({
  devices,
  flyToSerial,
  markerRefs,
}: {
  devices:     MappedDevice[];
  flyToSerial?: string | null;
  markerRefs:  React.MutableRefObject<Map<string, LeafletMarker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!flyToSerial) return;
    const device = devices.find((d) => d.serial === flyToSerial);
    if (!device) return;
    map.flyTo([device.lat, device.lng], 16, { duration: 1.0 });
    const timer = setTimeout(() => {
      markerRefs.current.get(flyToSerial)?.openPopup();
    }, 1100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToSerial]);
  return null;
}

// Legend shapes rendered in pure SVG (same as marker icons)
const LEGEND: Array<{ status: "online" | "offline" | "alerting" | "dormant"; label: string; shape: string }> = [
  { status: "online",   label: "Online",          shape: "circle" },
  { status: "offline",  label: "Offline",          shape: "diamond" },
  { status: "alerting", label: "Alerting",         shape: "triangle" },
  { status: "dormant",  label: "Dormant / Idle",   shape: "circle-dashed" },
];

interface Props {
  devices:      MappedDevice[];
  flyToSerial?: string | null;
}

export function NetworkMap({ devices, flyToSerial }: Props) {
  const markerRefs = useRef<Map<string, LeafletMarker>>(new Map());

  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No devices have location data set in Meraki Dashboard.
      </div>
    );
  }

  const center: [number, number] = [devices[0].lat, devices[0].lng];

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(0,0,0,0.35), 0 2px 10px rgba(0,0,0,0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(0,0,0,0), 0 2px 10px rgba(0,0,0,0.5); }
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0), 0 2px 10px rgba(0,0,0,0.5); }
        }
      `}</style>

      <div className="relative" style={{ height: 520 }}>
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: "100%", width: "100%", borderRadius: "0 0 0.75rem 0.75rem" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <AutoFit devices={devices} />
          <MapController devices={devices} flyToSerial={flyToSerial} markerRefs={markerRefs} />

          {devices.map((d) => (
            <Marker
              key={d.serial}
              position={[d.lat, d.lng]}
              icon={buildIcon(d.status, d.serial === flyToSerial)}
              ref={(m) => {
                if (m) markerRefs.current.set(d.serial, m);
                else   markerRefs.current.delete(d.serial);
              }}
              zIndexOffset={d.serial === flyToSerial ? 1000 : 0}
            >
              <Popup maxWidth={260}>
                <div className="text-xs space-y-1 min-w-[200px]">
                  <p className="font-semibold text-slate-900 text-sm">{d.name || d.serial}</p>
                  {d.address && <p className="text-slate-500">{d.address}</p>}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: STATUS_COLORS[d.status] ?? "#BBBBBB" }} />
                    <span className="capitalize font-medium" style={{ color: STATUS_COLORS[d.status] }}>
                      {d.status}
                    </span>
                  </div>
                  <table className="w-full text-slate-600 border-collapse">
                    <tbody>
                      <tr><td className="pr-2 text-slate-400 py-0.5">Type</td><td>{productLabel(d.productType)}</td></tr>
                      <tr><td className="pr-2 text-slate-400 py-0.5">Model</td><td className="font-mono">{d.model}</td></tr>
                      {d.lanIp && <tr><td className="pr-2 text-slate-400 py-0.5">LAN IP</td><td className="font-mono">{d.lanIp}</td></tr>}
                      <tr><td className="pr-2 text-slate-400 py-0.5">Last seen</td><td>{timeAgo(d.lastReportedAt)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend — shape + color dual encoding */}
        <div className="absolute bottom-6 right-3 z-[1000] bg-white/95 rounded-lg border border-gray-200 shadow-md px-3 py-2.5 text-xs space-y-1.5">
          <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider mb-1">Status</p>
          {LEGEND.map(({ status, label }) => {
            const c   = STATUS_COLORS[status];
            const s   = 14;
            const h   = s / 2;
            let svg: string;
            if (status === "offline") {
              const sq = 7;
              svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect x="${h-sq/2}" y="${h-sq/2}" width="${sq}" height="${sq}" rx="1.5" fill="${c}" stroke="white" stroke-width="2" transform="rotate(45 ${h} ${h})"/></svg>`;
            } else if (status === "alerting") {
              svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${h},1 ${s-1},${s-1} 1,${s-1}" fill="${c}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
            } else if (status === "dormant") {
              svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${h}" cy="${h}" r="4" fill="${c}" stroke="white" stroke-width="2" stroke-dasharray="2.5 1.5"/></svg>`;
            } else {
              svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${h}" cy="${h}" r="5" fill="${c}" stroke="white" stroke-width="2"/></svg>`;
            }
            return (
              <div key={status} className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: svg }} className="flex-shrink-0" />
                <span className="text-slate-600">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
