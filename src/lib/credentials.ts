import { useQuery } from "@tanstack/react-query";
import { achievements as achievementsDefault, certificates as certsDefault, codingProfiles } from "@/data/portfolio";
import { firebaseConfig, getDb, isFirebaseConfigured } from "@/lib/firebase";

export type Certificate = {
  title: string;
  issuer: string;
  year: string;
  category: string;
  /** Verification / credential URL. */
  link?: string;
  /** Uploaded certificate image (Firebase Storage URL or base64 data). */
  image?: string;
};

export type Achievement = {
  label: string;
  value: number;
  suffix?: string;
  note?: string;
  /** Optional proof image (certificate, screenshot, badge). */
  image?: string;
  link?: string;
};

export type Profile = {
  platform: string;
  username: string;
  stat: string;
  meta: string;
  badges: string[];
  url: string;
};

export type Credentials = {
  certificates: Certificate[];
  achievements: Achievement[];
  profiles: Profile[];
};

const DOC = { collection: "site", id: "credentials" };

export const credentialsDefault: Credentials = {
  certificates: certsDefault.map((c) => ({ ...c })),
  achievements: achievementsDefault.map((a) => ({ ...a })),
  profiles: codingProfiles.map((p) => ({ ...p, badges: [...p.badges] })),
};

/** Firestore credentials when configured, otherwise the built-in copy. */
export async function fetchCredentials(): Promise<Credentials> {
  if (!isFirebaseConfigured) return credentialsDefault;

  // 1. Try Firebase Web SDK
  try {
    const db = await getDb();
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, DOC.collection, DOC.id));
    if (snap.exists()) {
      const raw = snap.data() as Partial<Credentials>;
      return {
        certificates: raw.certificates?.length ? raw.certificates : credentialsDefault.certificates,
        achievements: raw.achievements?.length ? raw.achievements : credentialsDefault.achievements,
        profiles: raw.profiles?.length ? raw.profiles : credentialsDefault.profiles,
      };
    }
  } catch (sdkErr) {
    console.warn("Firestore SDK fetch failed, falling back to REST API:", sdkErr);
  }

  // 2. Direct Firestore REST API fallback (guaranteed to bypass any SDK initialization latency/issues)
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/site/credentials?key=${firebaseConfig.apiKey}`
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

      const certs = (json.fields?.certificates?.arrayValue?.values || []).map(parseField);
      const achs = (json.fields?.achievements?.arrayValue?.values || []).map(parseField);
      const profs = (json.fields?.profiles?.arrayValue?.values || []).map(parseField);

      return {
        certificates: certs.length ? certs : credentialsDefault.certificates,
        achievements: achs.length ? achs : credentialsDefault.achievements,
        profiles: profs.length ? profs : credentialsDefault.profiles,
      };
    }
  } catch (restErr) {
    console.warn("Firestore REST fetch failed:", restErr);
  }

  return credentialsDefault;
}

export async function saveCredentials(data: Credentials) {
  const db = await getDb();
  const { doc, setDoc } = await import("firebase/firestore");
  await setDoc(doc(db, DOC.collection, DOC.id), data);
}

export function useCredentials() {
  return useQuery({
    queryKey: ["credentials"],
    queryFn: fetchCredentials,
    placeholderData: credentialsDefault,
    staleTime: 5000,
    refetchOnMount: true,
  });
}
