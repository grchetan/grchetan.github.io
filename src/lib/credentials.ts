import { useQuery } from "@tanstack/react-query";
import { achievements as achievementsDefault, certificates as certsDefault, codingProfiles } from "@/data/portfolio";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

export type Certificate = {
  title: string;
  issuer: string;
  year: string;
  category: string;
  /** Verification / credential URL. */
  link?: string;
  /** Uploaded certificate image (Firebase Storage URL). */
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
  try {
    const db = await getDb();
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, DOC.collection, DOC.id));
    if (!snap.exists()) return credentialsDefault;
    const raw = snap.data() as Partial<Credentials>;
    return {
      certificates: raw.certificates?.length ? raw.certificates : credentialsDefault.certificates,
      achievements: raw.achievements?.length ? raw.achievements : credentialsDefault.achievements,
      profiles: raw.profiles?.length ? raw.profiles : credentialsDefault.profiles,
    };
  } catch {
    return credentialsDefault;
  }
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
    initialData: credentialsDefault,
    staleTime: 60_000,
  });
}
