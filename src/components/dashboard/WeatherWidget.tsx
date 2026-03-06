"use client";
import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer } from "lucide-react";
import type { WeatherData } from "@/app/api/weather/route";

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  const cls = className ?? "h-12 w-12";
  switch (condition) {
    case "rain":  return <CloudRain      className={cls} />;
    case "snow":  return <CloudSnow      className={cls} />;
    case "storm": return <CloudLightning className={cls} />;
    case "fog":
    case "wind":  return <Wind           className={cls} />;
    case "cloudy": return <Cloud         className={cls} />;
    default:       return <Sun           className={cls} />;
  }
}

const CONDITION_COLORS: Record<string, string> = {
  clear:  "text-amber-400",
  cloudy: "text-slate-400",
  rain:   "text-blue-400",
  snow:   "text-sky-300",
  storm:  "text-purple-400",
  fog:    "text-slate-300",
  wind:   "text-teal-400",
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setWeather)
      .catch(() => setError(true));
  }, []);

  if (error) return <WeatherWidgetError />;

  if (!weather) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 flex items-center gap-3 text-sm text-slate-400">
        <Thermometer className="h-5 w-5 flex-shrink-0 animate-pulse" />
        <span>Loading weather…</span>
      </div>
    );
  }

  const iconColor = CONDITION_COLORS[weather.condition] ?? "text-amber-400";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top row */}
      <div className="flex items-start justify-between px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">York, NE</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-slate-900">{weather.temperature}°</span>
            <span className="text-lg text-slate-400 mb-1.5">F</span>
          </div>
          <p className="text-sm font-medium text-slate-600 mt-1">{weather.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">Feels like {weather.feelsLike}°F</p>
        </div>
        <WeatherIcon condition={weather.condition} className={`h-16 w-16 ${iconColor} flex-shrink-0`} />
      </div>

      {/* Detail row */}
      <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
        <div className="flex items-center gap-2 px-6 py-3">
          <Droplets className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Humidity</p>
            <p className="text-sm font-semibold text-slate-700">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-3">
          <Wind className="h-4 w-4 text-teal-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Wind</p>
            <p className="text-sm font-semibold text-slate-700">{weather.windSpeed} mph</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeatherWidgetError() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 flex items-center gap-3 text-sm text-slate-400">
      <Thermometer className="h-5 w-5 flex-shrink-0" />
      <span>Weather data unavailable</span>
    </div>
  );
}
