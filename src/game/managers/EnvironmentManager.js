// What the sky should look like: the time of day from the visitor's own
// clock, and live weather for roughly where they are.
//
// Location comes from the browser's time zone (e.g. "America/Denver" ->
// Denver), not the geolocation API, so visitors never get a permission
// prompt. It's approximate -- everyone on "America/Los_Angeles" gets LA's
// weather -- which is plenty for rain on a pixel-art town. Weather and
// sunrise/sunset come from Open-Meteo (free, no API key).
//
// Both can be overridden from the Options menu, or with ?time=night and
// ?weather=snow in the URL for previewing.
//
// The helpers are exported separately (and are pure) so they can be unit
// tested without a browser.

export const PERIODS = ["dawn", "day", "evening", "night"];
export const WEATHERS = ["clear", "cloudy", "fog", "rain", "snow", "storm"];

const TIME_KEY = "exp:timeOverride";
const WEATHER_KEY = "exp:weatherOverride";
const CACHE_KEY = "exp:weatherCache";
const CACHE_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

/** WMO weather interpretation codes, as returned by Open-Meteo. */
export function weatherFromCode(code) {
  if (code == null || code <= 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloudy";
}

const minutesOf = (date) => date.getHours() * 60 + date.getMinutes();

/**
 * Dawn is the ~90 minutes around sunrise and evening the stretch around
 * sunset. Without real sun times, assume 6:30am and 7pm.
 * @param {Date} date
 * @param {{sunrise: Date, sunset: Date}} [sun]
 */
export function periodAt(date, sun) {
  const now = minutesOf(date);
  const rise = sun ? minutesOf(sun.sunrise) : 6 * 60 + 30;
  const set = sun ? minutesOf(sun.sunset) : 19 * 60;
  if (now >= rise - 45 && now < rise + 45) return "dawn";
  if (now >= rise + 45 && now < set - 60) return "day";
  if (now >= set - 60 && now < set + 40) return "evening";
  return "night";
}

/** "America/Argentina/Buenos_Aires" -> "Buenos Aires"; null for UTC etc. */
export function cityFromTimeZone(tz) {
  if (!tz || !tz.includes("/") || tz.startsWith("Etc/")) return null;
  return tz.split("/").pop().replace(/_/g, " ");
}

/**
 * Many cities share a name (Denver, CO vs Denver, TX), so only trust a
 * geocoding result in the visitor's own time zone.
 */
export function pickPlace(results, tz) {
  return (results || []).find((r) => r.timezone === tz) || null;
}

/** Component-wise multiply of two 0xRRGGBB colours (how tints stack). */
export function multiplyColors(a, b) {
  const channel = (shift) =>
    Math.round((((a >> shift) & 255) * ((b >> shift) & 255)) / 255);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** Blend a colour toward white; amount 0 = unchanged, 1 = white. */
export function lighten(color, amount) {
  const channel = (shift) => {
    const c = (color >> shift) & 255;
    return Math.round(c + (255 - c) * amount);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

function readStorage(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable -- overrides just won't persist.
  }
}

async function getJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

class EnvironmentManager {
  constructor() {
    this.listeners = new Set();
    // Until the forecast arrives (or if it never does), assume clear skies.
    this.live = { weather: "clear", sun: null, place: null };
    const params = new URLSearchParams(window.location.search);
    this.urlTime = PERIODS.includes(params.get("time")) ? params.get("time") : null;
    this.urlWeather = WEATHERS.includes(params.get("weather"))
      ? params.get("weather")
      : null;
    this.fetchLive();
  }

  get timeSetting() {
    return this.urlTime || readStorage(TIME_KEY, "auto");
  }

  get weatherSetting() {
    return this.urlWeather || readStorage(WEATHER_KEY, "auto");
  }

  get period() {
    const setting = this.timeSetting;
    return PERIODS.includes(setting) ? setting : periodAt(new Date(), this.live.sun);
  }

  get weather() {
    const setting = this.weatherSetting;
    return WEATHERS.includes(setting) ? setting : this.live.weather;
  }

  /** Where the live weather is from, only while it's actually being used. */
  get place() {
    return this.weatherSetting === "auto" ? this.live.place : null;
  }

  /** Options menu: Auto -> each value -> back to Auto. */
  cycle(kind) {
    const values = kind === "time" ? PERIODS : WEATHERS;
    const current = kind === "time" ? this.timeSetting : this.weatherSetting;
    const next = values[values.indexOf(current) + 1] || "auto";
    if (kind === "time") this.urlTime = null;
    else this.urlWeather = null;
    writeStorage(kind === "time" ? TIME_KEY : WEATHER_KEY, next === "auto" ? null : next);
    this.emit();
    return next;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.listeners.forEach((fn) => fn());
  }

  async fetchLive() {
    try {
      const cached = JSON.parse(readStorage(CACHE_KEY, "null") || "null");
      if (cached && Date.now() - cached.at < CACHE_MS) {
        this.setLive(cached.data);
        return;
      }
    } catch {
      // Corrupt cache -- just fetch again.
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = cityFromTimeZone(tz);
    if (!city) return;

    try {
      const geo = await getJSON(
        "https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&name=" +
          encodeURIComponent(city),
      );
      const place = pickPlace(geo.results, tz);
      if (!place) return;

      const forecast = await getJSON(
        "https://api.open-meteo.com/v1/forecast?current=weather_code" +
          "&daily=sunrise,sunset&timezone=auto&forecast_days=1" +
          `&latitude=${place.latitude}&longitude=${place.longitude}`,
      );
      const data = {
        code: forecast.current?.weather_code,
        sunrise: forecast.daily?.sunrise?.[0],
        sunset: forecast.daily?.sunset?.[0],
        place: place.name,
      };
      writeStorage(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
      this.setLive(data);
    } catch {
      // Offline, blocked, or rate-limited: stay on clear skies and the clock.
    }
  }

  setLive({ code, sunrise, sunset, place }) {
    this.live = {
      weather: weatherFromCode(code),
      // Open-Meteo returns local times without an offset ("2026-09-23T06:48"),
      // which Date parses as local -- the same zone we looked up.
      sun:
        sunrise && sunset
          ? { sunrise: new Date(sunrise), sunset: new Date(sunset) }
          : null,
      place,
    };
    this.emit();
  }
}

// Node's test runner has no window; only build the singleton in the browser.
const Environment =
  typeof window === "undefined" ? null : new EnvironmentManager();

export default Environment;
