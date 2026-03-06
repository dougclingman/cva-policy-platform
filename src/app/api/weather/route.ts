import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 minutes

// York, NE coordinates
const LAT = 40.8694;
const LON = -97.5922;

const WMO_DESCRIPTIONS: Record<number, { label: string; condition: "clear" | "cloudy" | "rain" | "snow" | "storm" | "fog" | "wind" }> = {
  0:  { label: "Clear sky",          condition: "clear" },
  1:  { label: "Mainly clear",       condition: "clear" },
  2:  { label: "Partly cloudy",      condition: "cloudy" },
  3:  { label: "Overcast",           condition: "cloudy" },
  45: { label: "Foggy",              condition: "fog" },
  48: { label: "Icy fog",            condition: "fog" },
  51: { label: "Light drizzle",      condition: "rain" },
  53: { label: "Drizzle",            condition: "rain" },
  55: { label: "Heavy drizzle",      condition: "rain" },
  61: { label: "Light rain",         condition: "rain" },
  63: { label: "Rain",               condition: "rain" },
  65: { label: "Heavy rain",         condition: "rain" },
  71: { label: "Light snow",         condition: "snow" },
  73: { label: "Snow",               condition: "snow" },
  75: { label: "Heavy snow",         condition: "snow" },
  77: { label: "Snow grains",        condition: "snow" },
  80: { label: "Rain showers",       condition: "rain" },
  81: { label: "Rain showers",       condition: "rain" },
  82: { label: "Heavy rain showers", condition: "rain" },
  85: { label: "Snow showers",       condition: "snow" },
  86: { label: "Heavy snow showers", condition: "snow" },
  95: { label: "Thunderstorm",       condition: "storm" },
  96: { label: "Thunderstorm",       condition: "storm" },
  99: { label: "Thunderstorm",       condition: "storm" },
};

export type WeatherData = {
  temperature:    number;
  feelsLike:      number;
  humidity:       number;
  windSpeed:      number;
  condition:      string;
  label:          string;
  weatherCode:    number;
};

export async function GET() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Chicago`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
    }

    const data = await res.json();
    const c = data.current;
    const wmo = WMO_DESCRIPTIONS[c.weather_code as number] ?? { label: "Unknown", condition: "clear" };

    const weather: WeatherData = {
      temperature: Math.round(c.temperature_2m),
      feelsLike:   Math.round(c.apparent_temperature),
      humidity:    Math.round(c.relative_humidity_2m),
      windSpeed:   Math.round(c.wind_speed_10m),
      condition:   wmo.condition,
      label:       wmo.label,
      weatherCode: c.weather_code,
    };

    return NextResponse.json(weather);
  } catch (err) {
    console.error("[weather]", err);
    return NextResponse.json({ error: "Weather unavailable" }, { status: 500 });
  }
}
