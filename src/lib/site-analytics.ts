/**
 * Google Analytics (GA4) + Google Sheets visit tracking.
 * All counts on the site (home page "Portfolio views" and the admin
 * Traffic studio) come from the Apps Script endpoint below.
 */

export const GA_MEASUREMENT_ID = "G-HLS482HB27";

export const SHEET_ANALYTICS_URL =
  "https://script.google.com/macros/s/AKfycby0cm2hNwFnaxwGEcOsrk3KJefwNUDcrcDhSUHndZ01xNFDa1Dkv0EMVjdPRWGKH3z5/exec";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __gaLoaded?: boolean;
  }
}

/** Injects gtag.js once and configures GA4. */
export function initGoogleAnalytics() {
  if (typeof window === "undefined" || window.__gaLoaded) return;
  window.__gaLoaded = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

/** GA4 page_view for client-side route changes. */
export function trackGaPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Logs the visit into the Google Sheet (fire and forget). */
export function trackSheetVisit(path: string) {
  if (typeof window === "undefined") return;
  const url =
    `${SHEET_ANALYTICS_URL}?action=track` +
    `&page=${encodeURIComponent(path)}` +
    `&ref=${encodeURIComponent(document.referrer)}` +
    `&ua=${encodeURIComponent(navigator.userAgent)}` +
    `&screen=${encodeURIComponent(`${screen.width}x${screen.height}`)}`;
  void fetch(url, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}

export function trackPageView(path: string) {
  trackGaPageView(path);
  trackSheetVisit(path);
}

/* ---------------- stats ---------------- */

export type SheetPair = { key: string; count: number };

export type SheetStats = {
  total: number;
  today?: number | undefined;
  unique?: number | undefined;
  last7?: number | undefined;
  month?: number | undefined;
  days: SheetPair[];
  pages: SheetPair[];
  referrers: SheetPair[];
  devices: SheetPair[];
  recent: RecentVisit[];
  raw: Record<string, unknown>;
};

export type RecentVisit = { time: string; page: string; ref: string; ua: string };

function toPairs(value: unknown): SheetPair[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((row) => {
        if (Array.isArray(row)) return { key: String(row[0]), count: Number(row[1]) || 0 };
        if (row && typeof row === "object") {
          const o = row as Record<string, unknown>;
          const key = o["key"] ?? o["page"] ?? o["path"] ?? o["ref"] ?? o["label"] ?? o["date"] ?? o["name"];
          const count = o["count"] ?? o["total"] ?? o["visits"] ?? o["value"];
          return { key: String(key ?? ""), count: Number(count) || 0 };
        }
        return { key: String(row), count: 0 };
      })
      .filter((p) => p.key);
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([key, v]) => ({
      key,
      count: Number(v) || 0,
    }));
  }
  return [];
}

function countBy<T>(rows: T[], key: (row: T) => string): SheetPair[] {
  const m = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

export function deviceFromUa(ua = ""): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

const num = (v: unknown) => (typeof v === "undefined" || v === null ? undefined : Number(v) || 0);

/** Reads aggregated stats from the Apps Script endpoint. */
export async function fetchSheetStats(retries = 2): Promise<SheetStats> {
  let res = await fetch(`${SHEET_ANALYTICS_URL}?action=stats`, { cache: "no-store" });
  // Apps Script occasionally answers a cold request with 404/5xx — retry briefly.
  for (let i = 0; i < retries && !res.ok; i++) {
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    res = await fetch(`${SHEET_ANALYTICS_URL}?action=stats`, { cache: "no-store" });
  }
  if (!res.ok) throw new Error(`Stats request failed (${res.status})`);
  const data = (await res.json()) as Record<string, unknown>;
  const recent = Array.isArray(data["recent"]) ? (data["recent"] as RecentVisit[]) : [];
  const pages = toPairs(data["pages"] ?? data["topPages"] ?? data["byPage"]);
  const devices = toPairs(data["devices"] ?? data["byDevice"] ?? data["screens"]);

  return {
    total: Number(data["total"]) || 0,
    today: num(data["today"]),
    unique: num(data["unique"] ?? data["uniqueVisitors"]),
    last7: num(data["last7"] ?? data["week"]),
    month: num(data["month"]),
    days: toPairs(data["days"] ?? data["daily"] ?? data["byDate"]),
    pages: pages.length ? pages : countBy(recent, (v) => v.page || "/"),
    referrers: toPairs(data["referrers"] ?? data["topReferrers"] ?? data["byRef"] ?? data["refs"]),
    devices: devices.length ? devices : countBy(recent, (v) => deviceFromUa(v.ua)),
    recent,
    raw: data,
  };
}
