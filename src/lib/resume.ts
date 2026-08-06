import { useQuery } from "@tanstack/react-query";
import { resumeDefault, type ResumeData } from "@/data/resume";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

const DOC = { collection: "site", id: "resume" };

/** Firestore resume when configured, otherwise the built-in copy. */
export async function fetchResume(): Promise<ResumeData> {
  if (!isFirebaseConfigured) return resumeDefault;
  try {
    const db = await getDb();
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, DOC.collection, DOC.id));
    if (!snap.exists()) return resumeDefault;
    const raw = snap.data() as Partial<ResumeData>;
    return {
      ...resumeDefault,
      ...raw,
      links: raw.links?.length ? raw.links : resumeDefault.links,
      sections: raw.sections?.length ? raw.sections : resumeDefault.sections,
    };
  } catch {
    return resumeDefault;
  }
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
    initialData: resumeDefault,
    staleTime: 60_000,
  });
}
