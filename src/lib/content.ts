import { useQuery } from "@tanstack/react-query";
import { entriesFor, findEntry, type Entry } from "@/data/catalog";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

const COLLECTION = "entries";

function normalise(raw: Record<string, unknown>, id: string): Entry {
  const arr = (v: unknown) =>
    Array.isArray(v) ? (v as string[]) : typeof v === "string" && v ? v.split(",").map((s) => s.trim()) : [];
  return {
    slug: (raw["slug"] as string) || id,
    title: (raw["title"] as string) || "Untitled",
    kind: (raw["kind"] as Entry["kind"]) || "project",
    tag: (raw["tag"] as string) || "Project",
    year: String(raw["year"] ?? ""),
    status: raw["status"] as string | undefined,
    summary: (raw["summary"] as string) || "",
    about: (raw["about"] as string) || "",
    problem: (raw["problem"] as string) || "",
    solution: (raw["solution"] as string) || "",
    result: raw["result"] as string | undefined,
    client: raw["client"] as string | undefined,
    tech: arr(raw["tech"]),
    features: arr(raw["features"]),
    images: arr(raw["images"]),
    liveUrl: raw["liveUrl"] as string | undefined,
    repoUrl: raw["repoUrl"] as string | undefined,
    downloadUrl: raw["downloadUrl"] as string | undefined,
    downloadLabel: raw["downloadLabel"] as string | undefined,
    featured: Boolean(raw["featured"]),
  };
}

/**
 * Fetches entries from Firestore when Firebase is configured.
 * - Firebase NOT configured (local dev): returns local placeholder data so the UI isn't empty.
 * - Firebase IS configured: returns ONLY real Firestore entries. Never falls back to local demo
 *   data so that mock projects never appear on the live portfolio.
 */
export async function fetchEntries(kind: Entry["kind"]): Promise<Entry[]> {
  // Local / offline dev — show placeholder data so the UI is not blank
  if (!isFirebaseConfigured) return entriesFor(kind);

  try {
    const db = await getDb();
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, COLLECTION));
    const allRemote = snap.docs.map((d) => normalise(d.data() as Record<string, unknown>, d.id));
    // Return real data (possibly empty — that's intentional; no demo fallback)
    return allRemote.filter((e) => (e.kind ? e.kind === kind : kind === "project"));
  } catch (err) {
    console.error("[Content] Error fetching entries from Firestore:", err);
    // On error, return empty so demo data never leaks into production
    return [];
  }
}

export function useEntries(kind: Entry["kind"]) {
  return useQuery({
    queryKey: ["entries", kind],
    queryFn: () => fetchEntries(kind),
    staleTime: 0,
    retry: 1,
    retryDelay: 2000,
  });
}

export function useEntry(kind: Entry["kind"], slug: string) {
  return useQuery({
    queryKey: ["entry", kind, slug],
    queryFn: async () => (await fetchEntries(kind)).find((e) => e.slug === slug) ?? null,
    staleTime: 0,
    retry: 1,
    retryDelay: 2000,
  });
}

/* ---------------- contact messages ---------------- */

export type Message = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  purpose?: string;
  budget?: string;
  message: string;
  createdAt: number;
  replied?: boolean;
  reply?: string;
};

export async function submitMessage(data: Omit<Message, "id" | "createdAt" | "replied">) {
  if (!isFirebaseConfigured) return false;
  const db = await getDb();
  const { collection, addDoc } = await import("firebase/firestore");
  await addDoc(collection(db, "messages"), { ...data, createdAt: Date.now(), replied: false });
  return true;
}

/* ---------------- traffic ---------------- */

export async function trackVisit(path: string) {
  if (!isFirebaseConfigured) return;
  try {
    const db = await getDb();
    const { collection, addDoc } = await import("firebase/firestore");
    let visitor = localStorage.getItem("visitor-id");
    if (!visitor) {
      visitor = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("visitor-id", visitor);
    }
    await addDoc(collection(db, "visits"), {
      path,
      visitor,
      referrer: document.referrer || "direct",
      createdAt: Date.now(),
    });
  } catch {
    /* analytics must never break the page */
  }
}

/* ---------------- download events ---------------- */

export type DownloadEvent = {
  slug: string;
  title: string;
  kind: Entry["kind"];
  label: string;
  url: string;
  path: string;
  visitor: string;
  referrer: string;
  createdAt: number;
};

function visitorId() {
  let visitor = localStorage.getItem("visitor-id");
  if (!visitor) {
    visitor = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("visitor-id", visitor);
  }
  return visitor;
}

/** Fire-and-forget: records that an app build / file was downloaded. */
export async function trackDownload(input: {
  slug: string;
  title: string;
  kind: Entry["kind"];
  label?: string;
  url: string;
}) {
  if (!isFirebaseConfigured) return;
  try {
    const db = await getDb();
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "downloads"), {
      slug: input.slug,
      title: input.title,
      kind: input.kind,
      label: input.label || "Download",
      url: input.url,
      path: window.location.pathname,
      visitor: visitorId(),
      referrer: document.referrer || "direct",
      createdAt: Date.now(),
    });
  } catch {
    /* analytics must never break a download */
  }
}

export async function fetchDownloads(max = 2000): Promise<DownloadEvent[]> {
  if (!isFirebaseConfigured) return [];
  const db = await getDb();
  const { collection, getDocs, orderBy, query, limit } = await import("firebase/firestore");
  const snap = await getDocs(query(collection(db, "downloads"), orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => d.data() as DownloadEvent);
}

