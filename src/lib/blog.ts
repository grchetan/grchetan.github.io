import { useQuery } from "@tanstack/react-query";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

export type Post = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  /** ISO date, e.g. 2026-02-14 */
  date: string;
  readMins: number;
  cover?: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  /** Plain text body — blank lines split paragraphs, "## " lines are headings. */
  body: string;
};

export const postCategories = ["Web Dev", "Tips & Tricks", "Projects", "Career"] as const;

export const emptyPost: Post = {
  slug: "",
  title: "",
  category: "Web Dev",
  excerpt: "",
  date: new Date().toISOString().slice(0, 10),
  readMins: 4,
  cover: "",
  tags: [],
  featured: false,
  published: true,
  body: "",
};

/** Starter posts so the blog never looks empty before the first upload. */
export const defaultPosts: Post[] = [
  {
    slug: "how-i-built-my-portfolio",
    title: "How I built my portfolio website",
    category: "Web Dev",
    excerpt:
      "The full story behind this site — design system, animation budget, and the admin panel that keeps every page editable.",
    date: "2026-01-18",
    readMins: 6,
    tags: ["React", "Motion", "Design"],
    featured: true,
    published: true,
    body:
      "I wanted a portfolio that did not look like a template. That meant building a design system first and treating animation as part of the layout, not decoration.\n\n## The design system\nEvery colour, shadow and glass panel lives in one stylesheet as a token. Components only reference tokens, so a single change re-themes the entire site.\n\n## Motion budget\nAnimations run on transform and opacity only. Anything heavier gets cut — a portfolio that stutters says more about you than the copy does.\n\n## The admin panel\nProjects, apps, certificates, resume and now these posts are uploaded from a private dashboard, so nothing needs a code change to publish.",
  },
  {
    slug: "firebase-admin-panel-lessons",
    title: "Shipping an admin panel with Firebase",
    category: "Projects",
    excerpt: "What I learned wiring Firestore, Storage and auth into a personal site without over-engineering it.",
    date: "2026-02-06",
    readMins: 5,
    tags: ["Firebase", "Firestore", "Storage"],
    featured: false,
    published: true,
    body:
      "Firestore is a great fit for a portfolio: small documents, few writes, instant reads.\n\n## Keep documents flat\nOne document per project and one per post. No nesting, no joins, no surprises when the shape changes.\n\n## Uploads belong in Storage\nImages go to Storage and only the download URL is stored in Firestore. That keeps documents tiny and cache-friendly.\n\n## Guard the writes\nRead access is public, writes require auth. That single rule is the whole security model.",
  },
  {
    slug: "learning-full-stack-fast",
    title: "Learning full stack development fast",
    category: "Career",
    excerpt: "The loop that moved me forward faster than any tutorial playlist: build, break, explain, repeat.",
    date: "2026-03-02",
    readMins: 4,
    tags: ["Learning", "Career"],
    featured: false,
    published: true,
    body:
      "Tutorials feel productive because they remove the hard part — deciding what to build next.\n\n## Build something you will use\nYou notice bugs in your own tools within a day. That feedback is worth more than a course certificate.\n\n## Explain it out loud\nIf you cannot explain the request lifecycle in plain language, you do not know it yet. Writing posts like this is the test.",
  },
];

const COLLECTION = "posts";

export async function fetchPosts(): Promise<Post[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const db = await getDb();
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs
      .map((d) => ({ ...emptyPost, ...(d.data() as Partial<Post>), slug: d.id }) as Post)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

export async function savePost(post: Post) {
  const db = await getDb();
  const { doc, setDoc } = await import("firebase/firestore");
  await setDoc(doc(db, COLLECTION, post.slug), post);
}

export async function removePost(slug: string) {
  const db = await getDb();
  const { doc, deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, COLLECTION, slug));
}

/** Published posts, newest first. */
export function usePosts() {
  const query = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    staleTime: 30_000,
  });
  const posts = (query.data ?? [])
    .filter((p) => p.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return { ...query, posts };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatPostDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Split a plain-text body into headings and paragraphs. */
export function parseBody(body: string) {
  const blocks: { type: "heading" | "para"; text: string }[] = [];
  for (const chunk of body.split(/\n{2,}/)) {
    let para: string[] = [];
    const flush = () => {
      const text = para.join(" ").trim();
      if (text) blocks.push({ type: "para", text });
      para = [];
    };
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        flush();
        blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
      } else {
        para.push(trimmed);
      }
    }
    flush();
  }
  return blocks;
}
