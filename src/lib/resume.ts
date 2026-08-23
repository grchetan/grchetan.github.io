import { useQuery } from "@tanstack/react-query";
import { resumeDefault, type ResumeData } from "@/data/resume";
import { firebaseConfig, getDb, isFirebaseConfigured } from "@/lib/firebase";

const DOC = { collection: "site", id: "resume" };
const CACHE_KEY = "site_resume_cache_v2";

function getCachedResume(): ResumeData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
        return parsed as ResumeData;
      }
    }
  } catch {}
  return null;
}

function setCachedResume(data: ResumeData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

/** Firestore resume when configured, otherwise the built-in copy. */
export async function fetchResume(): Promise<ResumeData> {
  if (!isFirebaseConfigured) return resumeDefault;

  // 1. Try Firebase Web SDK
  try {
    const db = await getDb();
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, DOC.collection, DOC.id));
    if (snap.exists()) {
      const raw = snap.data() as Partial<ResumeData>;
      const result: ResumeData = {
        ...resumeDefault,
        ...raw,
        links: raw.links?.length ? raw.links : resumeDefault.links,
        sections: raw.sections?.length ? raw.sections : resumeDefault.sections,
      };
      setCachedResume(result);
      return result;
    }
  } catch (sdkErr) {
    console.warn("Firestore SDK fetch failed, trying REST API:", sdkErr);
  }

  // 2. Direct Firestore REST API fallback
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/site/resume?key=${firebaseConfig.apiKey}`
    );
    if (res.ok) {
      const json = await res.json();
      const parseField = (f: any): any => {
        if (!f) return null;
        if (f.stringValue !== undefined) return f.stringValue;
        if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
        if (f.arrayValue !== undefined) return (f.arrayValue.values || []).map(parseField);
        if (f.mapValue !== undefined) {
          const obj: Record<string, any> = {};
          for (const [k, v] of Object.entries(f.mapValue.fields || {})) {
            obj[k] = parseField(v);
          }
          return obj;
        }
        return null;
      };

      const parsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(json.fields || {})) {
        parsed[k] = parseField(v);
      }

      const result: ResumeData = {
        ...resumeDefault,
        ...parsed,
        links: parsed.links?.length ? parsed.links : resumeDefault.links,
        sections: parsed.sections?.length ? parsed.sections : resumeDefault.sections,
      } as ResumeData;

      setCachedResume(result);
      return result;
    }
  } catch (restErr) {
    console.warn("Firestore REST fetch failed:", restErr);
  }

  return getCachedResume() ?? resumeDefault;
}

export async function saveResume(data: ResumeData) {
  setCachedResume(data);
  const db = await getDb();
  const { doc, setDoc } = await import("firebase/firestore");
  await setDoc(doc(db, DOC.collection, DOC.id), data);
}

export function useResume() {
  const cached = getCachedResume();
  return useQuery({
    queryKey: ["resume"],
    queryFn: fetchResume,
    initialData: cached ?? undefined,
    staleTime: 10_000,
    refetchOnMount: true,
  });
}
