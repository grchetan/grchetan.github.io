import { useQuery } from "@tanstack/react-query";
import { resumeDefault, type ResumeData } from "@/data/resume";
import { firebaseConfig, getDb, isFirebaseConfigured } from "@/lib/firebase";

const DOC = { collection: "site", id: "resume" };

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
      return {
        ...resumeDefault,
        ...raw,
        links: raw.links?.length ? raw.links : resumeDefault.links,
        sections: raw.sections?.length ? raw.sections : resumeDefault.sections,
      };
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

      return {
        ...resumeDefault,
        ...parsed,
        links: parsed.links?.length ? parsed.links : resumeDefault.links,
        sections: parsed.sections?.length ? parsed.sections : resumeDefault.sections,
      } as ResumeData;
    }
  } catch (restErr) {
    console.warn("Firestore REST fetch failed:", restErr);
  }

  return resumeDefault;
}

export async function saveResume(data: ResumeData) {
  const db = await getDb();
  const { doc, setDoc } = await import("firebase/firestore");
  await setDoc(doc(db, DOC.collection, DOC.id), data);
}

export function useResume() {
  return useQuery({
    queryKey: ["resume"],
    queryFn: fetchResume,
    placeholderData: resumeDefault,
    staleTime: 5000,
    refetchOnMount: true,
  });
}
