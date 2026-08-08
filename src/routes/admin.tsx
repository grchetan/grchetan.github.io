import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Award,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  ImagePlus,
  Inbox,
  LayoutGrid,
  Gamepad2,
  LogOut,
  Moon,
  Pencil,
  PenLine,
  Plus,
  RefreshCw,
  Sun,
  Trash2,
  X,
  Download,
} from "lucide-react";
import { ResumeManager } from "@/components/site/resume-editor";
import { CredentialsManager } from "@/components/site/credentials-editor";
import { BlogManager } from "@/components/site/blog-editor";
import { ArcadeControlManager } from "@/components/site/arcade-control";
import { useTheme } from "@/components/site/chrome";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { allEntries, type Entry } from "@/data/catalog";
import { getAuthClient, getDb, isFirebaseConfigured, uploadImage, uploadImageWithProgress, type UploadProgressInfo } from "@/lib/firebase";
import { fetchDownloads, type DownloadEvent, type Message } from "@/lib/content";
import adminLoginArt from "@/assets/signin.png";

import { cn } from "@/lib/utils";
import {
  deviceFromUa,
  fetchSheetStats,
  GA_MEASUREMENT_ID,
  type SheetPair,
  type SheetStats,
} from "@/lib/site-analytics";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — Chetan Prajapat" },
      { name: "description", content: "Private admin panel for portfolio content, messages and traffic." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin — Chetan Prajapat" },
      { property: "og:description", content: "Private admin panel." },
    ],
  }),
});

type Tab = "content" | "arcade" | "blog" | "credentials" | "resume" | "inbox" | "traffic";

function formatBytes(bytes?: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const emptyForm: Entry = {
  slug: "",
  title: "",
  kind: "project",
  tag: "Full Stack",
  year: String(new Date().getFullYear()),
  summary: "",
  about: "",
  problem: "",
  solution: "",
  result: "",
  client: "",
  tech: [],
  features: [],
  images: [],
  liveUrl: "",
  repoUrl: "",
  downloadUrl: "",
  downloadLabel: "",
  featured: false,
};

const input = "admin-field";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {hint ? <span className="mt-1 block text-[0.78rem] leading-snug text-ink-soft">{hint}</span> : null}
      {children}
    </label>
  );
}

/** Numbered, titled block so long forms stay readable and obvious. */
function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink/12 bg-paper p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ink/[0.06] font-mono text-[0.72rem] text-ink">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="text-[1.05rem] leading-tight text-ink">{title}</h3>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">{hint}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}


/* ---------------- setup notice ---------------- */

function SetupNotice() {
  return (
    <div className="plate mx-auto mt-10 max-w-2xl p-7">
      <span className="label">Firebase not connected</span>
      <h2 className="mt-4 text-[1.6rem] leading-snug">Add your Firebase keys to unlock the admin panel</h2>
      <p className="mt-4 text-[0.95rem] leading-[1.8] text-ink-soft">
        Create a Firebase project, enable <strong>Authentication (Email/Password)</strong>, <strong>Firestore</strong>{" "}
        and <strong>Storage</strong>, then add these environment variables:
      </p>
      <pre className="mt-5 overflow-x-auto rounded-lg border border-ink/15 bg-ink/[0.05] p-4 font-mono text-[0.72rem] leading-relaxed text-ink">{`VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=`}</pre>
      <p className="caption mt-5">
        Until then the site serves the built-in catalogue, and the contact form falls back to opening your mail client.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/" className="press-btn-outline">
          Back to site
        </Link>
      </div>
    </div>
  );
}

/* ---------------- login ---------------- */

const ADMIN_EMAILS = ["chetanprajapat340@gmail.com"];
const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const auth = await getAuthClient();
      const { signInWithEmailAndPassword, signOut } = await import("firebase/auth");
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!isAdminEmail(cred.user.email)) {
        await signOut(auth);
        toast.error("This account is not authorised for the admin panel.");
        return;
      }
    } catch {
      toast.error("Wrong email or password.");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    const target = email.trim();
    if (!target) {
      toast.error("Enter your admin email first, then tap “Forgot password”.");
      return;
    }
    setResetting(true);
    try {
      const auth = await getAuthClient();
      const { sendPasswordResetEmail } = await import("firebase/auth");
      try {
        await sendPasswordResetEmail(auth, target, {
          url: `${window.location.origin}/admin`,
        });
      } catch {
        // Fallback without actionCodeSettings if origin domain is not whitelisted in Firebase Console
        await sendPasswordResetEmail(auth, target);
      }
      toast.success("Reset link sent successfully. Check your inbox (and spam folder).");
    } catch (err: any) {
      console.error("Password reset error:", err);
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        toast.error("No admin account found with this email address.");
      } else if (code === "auth/invalid-email") {
        toast.error("Invalid email address format. Please check and try again.");
      } else {
        toast.error(err?.message || "Could not send reset link. Check email and try again.");
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="admin-shell fixed inset-0 z-50 grid min-h-screen w-full grid-rows-[auto_1fr] bg-paper md:grid-cols-2 md:grid-rows-1">
      {/* left visual panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative hidden h-40 overflow-hidden sm:block sm:h-52 md:h-auto"
      >
        <img
          src={adminLoginArt}
          alt="Control room illustration"
          className="absolute inset-0 h-full w-full object-cover object-center"
          width={1024}
          height={1280}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-paper via-paper/70 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6 hidden md:bottom-10 md:left-10 md:right-10 md:block">
          <span className="label text-ink-soft">Chetan Prajapat</span>
          <h2 className="mt-3 font-display text-[2.25rem] leading-none text-ink">Control room</h2>
          <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
            Manage portfolio content, read messages, track traffic and publish new work.
          </p>
        </div>
      </motion.div>

      {/* right form panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center px-5 py-10 sm:px-10 sm:py-12"
      >
        {/* mobile-only brand header */}
        <div className="mb-8 flex w-full max-w-[22rem] min-w-0 items-center gap-3 sm:mb-10 md:hidden">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-chrome-2 to-chrome-3 font-display text-[1.15rem] text-white">
            C
          </span>
          <div className="min-w-0">
            <p className="truncate text-[1.05rem] font-semibold text-ink">Control room</p>
            <p className="caption truncate text-ink-soft">Chetan Prajapat</p>
          </div>
        </div>

        <form onSubmit={submit} className="w-full max-w-[22rem]">
          <span className="label">Admin access</span>
          <h1 className="mt-3 text-[1.7rem] leading-none sm:text-[1.85rem]">Sign in</h1>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
            Enter your credentials to open the dashboard.
          </p>

          <div className="mt-7 grid gap-4">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                placeholder="you@example.com"
                autoComplete="username"
                required
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="press-btn mt-7 w-full justify-center disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={forgotPassword}
            disabled={resetting}
            className="caption mt-5 w-full text-center underline underline-offset-4 disabled:opacity-50"
          >
            {resetting ? "Sending reset link…" : "Forgot password?"}
          </button>

          <Link
            to="/"
            className="caption mt-6 block w-full text-center text-ink-soft transition-colors hover:text-ink"
          >
            ← Back to site
          </Link>
        </form>
      </motion.div>
    </div>
  );
}


/* ---------------- content manager ---------------- */

function ContentManager() {
  const [items, setItems] = useState<(Entry & { id: string })[]>([]);
  const [form, setForm] = useState<Entry>({ ...emptyForm });
  const [techRaw, setTechRaw] = useState("");
  const [featuresRaw, setFeaturesRaw] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [imageMetadata, setImageMetadata] = useState<Record<string, { originalSize: number; compressedSize: number }>>({});
  const uploadCancelledRef = useRef(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const { collection, getDocs } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "entries"));
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Entry) })));
    } catch (err) {
      console.error("[Admin] Could not load entries from Firestore:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function reset() {
    setForm({ ...emptyForm });
    setTechRaw("");
    setFeaturesRaw("");
    setEditing(null);
  }

  function startEdit(entry: Entry & { id: string }) {
    const { id: _id, ...rest } = entry;
    setForm({ ...emptyForm, ...rest, images: [...(rest.images ?? [])] });
    setTechRaw((rest.tech ?? []).join(", "));
    setFeaturesRaw((rest.features ?? []).join(", "));
    setEditing(entry.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Upload any number of images and append their URLs to the gallery. */
  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading(true);
    uploadCancelledRef.current = false;
    try {
      const urls: string[] = [];
      for (const file of list) {
        if (uploadCancelledRef.current) break;
        let lastInfo: UploadProgressInfo | null = null;
        const url = await uploadImageWithProgress(file, form.kind, (info) => {
          if (uploadCancelledRef.current) return;
          lastInfo = info;
          setUploadProgress(info);
        });
        if (uploadCancelledRef.current) break;

        // Save compression stats
        if (lastInfo && (lastInfo as UploadProgressInfo).originalSize && (lastInfo as UploadProgressInfo).compressedSize) {
          const info = lastInfo as UploadProgressInfo;
          setImageMetadata((prev) => ({
            ...prev,
            [url]: {
              originalSize: info.originalSize!,
              compressedSize: info.compressedSize!,
            },
          }));
        }
        urls.push(url);
      }
      if (uploadCancelledRef.current) {
        toast.info("Upload cancelled.");
        return;
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} compressed & uploaded.`);
    } catch (err) {
      console.error("[Storage Upload Error]", err);
      toast.error("Upload failed — check Storage rules in Firebase Console.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  /** Upload the app build (APK etc.) and store its public download URL. */
  async function addAppBuild(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "app-builds");
      setForm((f) => ({ ...f, downloadUrl: url }));
      toast.success("App file uploaded.");
    } catch {
      toast.error("Upload failed — check Storage rules.");
    } finally {
      setUploading(false);
    }
  }


  function moveImage(i: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...f.images];
      const to = i + dir;
      if (to < 0 || to >= next.length) return f;
      const [row] = next.splice(i, 1);
      next.splice(to, 0, row!);
      return { ...f, images: next };
    });
  }

  /** Cleans up any imported demo catalog entries from Firestore. */
  async function removeDemoEntries() {
    setBusy(true);
    try {
      const demoSlugs = new Set(allEntries.map((e) => e.slug));
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      const demoItems = items.filter((i) => demoSlugs.has(i.slug));
      if (!demoItems.length) {
        toast.info("No demo entries found.");
        return;
      }
      for (const item of demoItems) {
        await deleteDoc(doc(db, "entries", item.id));
      }
      toast.success(`Removed ${demoItems.length} demo entries.`);
      if (editing && demoItems.some((i) => i.id === editing)) reset();
      await load();
    } catch (err) {
      console.error("[Remove Demo Entries Failed]:", err);
      toast.error("Failed to remove demo entries.");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const techArray = techRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const featuresArray = featuresRaw.split(",").map((s) => s.trim()).filter(Boolean);

    const payload: Entry = {
      ...form,
      tech: techArray,
      features: featuresArray,
      slug: form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    };

    setBusy(true);
    try {
      const db = await getDb();
      if (editing) {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "entries", editing), payload);
        toast.success(`${payload.title} updated.`);
      } else {
        const { collection, addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "entries"), payload);
        toast.success(`${payload.title} published.`);
      }
      reset();
      await load();
    } catch (err) {
      console.error("[Firestore Error] Save failed:", err);
      toast.error("Save failed — check Firestore rules in Firebase Console.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "entries", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editing === id) reset();
      toast.success("Deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  const list = (kind: Entry["kind"]) => items.filter((i) => i.kind === kind);

  return (
    <div className="grid items-start gap-8 xl:grid-cols-12">
      <form onSubmit={save} className="plate p-6 xl:col-span-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="label">{editing ? "Editing entry" : "Publish new"}</span>
            <h2 className="mt-2 text-[1.35rem]">Project / App / Freelance</h2>
          </div>
          {editing ? (
            <button type="button" onClick={reset} className="press-btn-outline">
              <X className="size-3.5" strokeWidth={1.5} /> Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5">
          <Step
            n={1}
            title="Where should this appear?"
            hint="Choose Project for personal builds, App for mobile/mini apps, Freelance for client work. It shows up on that page automatically."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" hint="Project → /projects · App → /apps · Freelance → /freelance">
                <select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as Entry["kind"] })}
                  className={input}
                >
                  <option value="project">Project</option>
                  <option value="app">App</option>
                  <option value="freelance">Freelance</option>
                </select>
              </Field>
              <Field label="Slug" hint="Page address. Leave empty and it is made from the title.">
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto from title"
                  className={cn(input, "font-mono text-[0.78rem]")}
                />
              </Field>
            </div>
          </Step>

          <Step n={2} title="Basics" hint="The name and small labels shown on the card.">
            <Field label="Title" hint="Name of the project, exactly as you want it displayed.">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={input}
                placeholder="SiteReady Pro"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tag" hint="e.g. Full Stack">
                <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className={input} />
              </Field>
              <Field label="Year" hint="When you built it">
                <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={input} />
              </Field>
              <Field label="Status" hint="Optional — Live, WIP…">
                <input
                  value={form.status ?? ""}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={input}
                />
              </Field>
            </div>
          </Step>

          <Step
            n={3}
            title="The story"
            hint="Summary shows on the card; the rest builds the case-study page. Write plainly, 1–3 lines each."
          >
            <Field label="Short summary" hint="One line visitors read first.">
              <textarea
                rows={2}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className={cn(input, "resize-none")}
              />
            </Field>
            <Field label="About this build" hint="What it is and who it is for.">
              <textarea
                rows={3}
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                className={cn(input, "resize-none")}
              />
            </Field>
            <Field label="Problem" hint="What was broken or missing before.">
              <textarea
                rows={2}
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                className={cn(input, "resize-none")}
              />
            </Field>
            <Field label="What you built (solution)" hint="How you solved it.">
              <textarea
                rows={2}
                value={form.solution}
                onChange={(e) => setForm({ ...form, solution: e.target.value })}
                className={cn(input, "resize-none")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Result" hint="Optional — the outcome or a number.">
                <input
                  value={form.result ?? ""}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                  className={input}
                />
              </Field>
              <Field label="Client" hint="Freelance work only.">
                <input
                  value={form.client ?? ""}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className={input}
                />
              </Field>
            </div>
          </Step>

          <Step n={4} title="Tech & links" hint="Separate items with commas. Links become buttons on the page.">
            <Field label="Tech used" hint="Comma separated">
              <input
                value={techRaw}
                onChange={(e) => setTechRaw(e.target.value)}
                className={input}
                placeholder="React, Node.js, Firebase"
              />
            </Field>
            <Field label="Features" hint="Comma separated">
              <input
                value={featuresRaw}
                onChange={(e) => setFeaturesRaw(e.target.value)}
                className={input}
                placeholder="Auth, Dashboard, Payments"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Live URL" hint="Optional — the live site.">
                <input
                  value={form.liveUrl ?? ""}
                  onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                  placeholder="https://…"
                  className={cn(input, "font-mono text-[0.78rem]")}
                />
              </Field>
              <Field label="GitHub repo" hint="Optional — the source code.">
                <input
                  value={form.repoUrl ?? ""}
                  onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                  placeholder="https://github.com/…"
                  className={cn(input, "font-mono text-[0.78rem]")}
                />
              </Field>
            </div>

            {form.kind === "app" ? (
              <div className="rounded-xl border border-ink/10 bg-paper-tint/60 p-4">
                <span className="label">App download file</span>
                <p className="mt-1 text-[0.78rem] leading-snug text-ink-soft">
                  Upload the APK / build file — it is stored in Cloud Storage and the app page gets a working
                  “Download app” button.
                </p>

                <label className="mt-3 grid cursor-pointer place-items-center rounded-xl border border-dashed border-ink/25 bg-paper px-5 py-6 text-center transition-colors hover:border-chrome-1/60">
                  <Download className="size-5 text-ink/40" strokeWidth={1.5} />
                  <span className="mt-2 text-[0.95rem] text-ink">
                    {uploading ? "Uploading…" : "Click to choose the app file"}
                  </span>
                  <span className="caption mt-1">APK, AAB, IPA or ZIP</span>
                  <input
                    type="file"
                    accept=".apk,.aab,.ipa,.zip,application/octet-stream"
                    onChange={(e) => {
                      void addAppBuild(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Download URL" hint="Filled after upload — or paste a link (Play Store etc.).">
                    <input
                      value={form.downloadUrl ?? ""}
                      onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
                      placeholder="https://…"
                      className={cn(input, "font-mono text-[0.78rem]")}
                    />
                  </Field>
                  <Field label="Button label" hint="Optional — defaults to “Download app”.">
                    <input
                      value={form.downloadLabel ?? ""}
                      onChange={(e) => setForm({ ...form, downloadLabel: e.target.value })}
                      placeholder="Download APK"
                      className={input}
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </Step>


          <Step
            n={5}
            title="Images"
            hint="Pick files from your computer — they upload straight to Firebase Storage, so no links needed. The first image is the cover; reorder with the arrows."
          >
            <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-ink/25 bg-paper-tint/60 px-5 py-6 text-center transition-colors hover:border-chrome-1/60 hover:bg-paper-tint">
              {uploading ? (
                <div className="w-full max-w-xs space-y-2 py-2">
                  <div className="flex items-center justify-center gap-2 text-ink">
                    <RefreshCw className="size-4 animate-spin text-chrome-1" />
                    <span className="text-[0.92rem] font-medium">
                      {uploadProgress?.stage === "compressing"
                        ? "Compressing image to WebP..."
                        : `Uploading ${uploadProgress?.progress || 0}%`}
                    </span>
                  </div>

                  {uploadProgress ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[0.72rem] font-mono text-ink-soft">
                        <span>
                          {uploadProgress.originalSize
                            ? `${formatBytes(uploadProgress.originalSize)} → ${formatBytes(uploadProgress.compressedSize || uploadProgress.totalBytes)}`
                            : uploadProgress.fileName}
                        </span>
                        <span>
                          {formatBytes(uploadProgress.bytesTransferred)} / {formatBytes(uploadProgress.totalBytes)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full bg-gradient-to-r from-chrome-2 via-chrome-1 to-chrome-3 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      uploadCancelledRef.current = true;
                      setUploading(false);
                      setUploadProgress(null);
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <X className="size-3" /> Cancel upload
                  </button>
                </div>
              ) : (
                <>
                  <ImagePlus className="size-5 text-ink/40" strokeWidth={1.5} />
                  <span className="mt-3 text-[0.95rem] text-ink">Click or drop to choose images</span>
                  <span className="caption mt-1">Auto-compresses to lightweight WebP · JPG or PNG</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => {
                  void addImages(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>

            {form.images.length ? (
              <ul className="grid gap-3 grid-cols-1">
                {form.images.map((src, i) => (
                  <li
                    key={`${src}-${i}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-ink/12 bg-paper-tint/30 p-3 transition-all hover:border-ink/25"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={src}
                        alt=""
                        className="size-14 sm:size-16 shrink-0 rounded-lg object-cover border border-ink/15 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[0.68rem] uppercase tracking-wider",
                              i === 0
                                ? "bg-chrome-1/20 text-ink border border-chrome-1/40 font-semibold"
                                : "bg-ink/[0.06] text-ink-soft",
                            )}
                          >
                            {i === 0 ? "★ Cover Image" : `Image ${i + 1}`}
                          </span>
                        </div>
                        {(() => {
                          const meta = imageMetadata[src];
                          if (meta) {
                            const savings = Math.round(((meta.originalSize - meta.compressedSize) / meta.originalSize) * 100);
                            return (
                              <div className="mt-1.5 flex flex-wrap gap-1.5 items-center font-mono text-[0.72rem] text-ink-soft">
                                <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                  {src.startsWith("data:") ? "Local WebP" : src.split("/").pop()}
                                </span>
                                <span>•</span>
                                <span>{formatBytes(meta.originalSize)}</span>
                                <span>→</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatBytes(meta.compressedSize)}</span>
                                <span className="rounded bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 text-[0.62rem] font-bold text-emerald-600 dark:text-emerald-400">
                                  Saved {savings}%
                                </span>
                              </div>
                            );
                          }
                          if (src.startsWith("data:")) {
                            const size = Math.round((src.length * 3) / 4);
                            return (
                              <div className="mt-1.5 flex flex-wrap gap-1.5 items-center font-mono text-[0.72rem] text-ink-soft">
                                <span>Local WebP (Base64)</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">~{formatBytes(size)}</span>
                              </div>
                            );
                          }
                          return (
                            <p className="caption truncate mt-1.5 font-mono text-[0.72rem] text-ink-soft">
                              {src.split("/").pop()}
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Arrange & Delete Actions Toolbar */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-ink/10 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        title="Move Up"
                        className="grid size-8 place-items-center rounded-lg border border-ink/15 text-ink transition-all hover:bg-chrome-1/20 hover:border-chrome-1/50 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronUp className="size-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === form.images.length - 1}
                        title="Move Down"
                        className="grid size-8 place-items-center rounded-lg border border-ink/15 text-ink transition-all hover:bg-chrome-1/20 hover:border-chrome-1/50 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronDown className="size-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, images: form.images.filter((_, x) => x !== i) })}
                        title="Remove Image"
                        className="grid size-8 place-items-center rounded-lg border border-destructive/30 text-destructive transition-all hover:bg-destructive/15 hover:border-destructive"
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="caption">No images yet — the first one you add becomes the cover.</p>
            )}

            <label className="mt-1 flex items-center gap-3 rounded-lg border border-ink/10 bg-paper-tint/50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={Boolean(form.featured)}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="size-4 accent-[var(--chrome-1)]"
              />
              <span className="text-[0.88rem] text-ink">Show this on the home page</span>
            </label>
          </Step>
        </div>


        <button type="submit" disabled={busy} className="press-btn mt-7 w-full justify-center disabled:opacity-50">
          {editing ? <Check className="size-3.5" strokeWidth={1.5} /> : <Plus className="size-3.5" strokeWidth={1.5} />}
          {busy ? "Saving…" : editing ? "Save changes" : "Publish"}
        </button>
      </form>

      <div className="min-w-0 xl:col-span-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="label">Published entries ({items.length})</span>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="press-btn-outline">
              <RefreshCw className="size-3.5" strokeWidth={1.5} /> Refresh
            </button>
          </div>
        </div>

        {loading ? <p className="caption mt-6">Loading…</p> : null}

        {(["project", "app", "freelance"] as const).map((kind) => (
          <div key={kind} className="mt-8">
            <span className="label">{kind}s ({list(kind).length})</span>
            <ul className="mt-3 grid gap-3">
              {list(kind).map((i) => (
                <li
                  key={i.id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border bg-paper p-3 transition-colors min-w-0",
                    editing === i.id ? "border-chrome-1/60 bg-chrome-1/[0.06]" : "border-ink/10 hover:border-chrome-1/40",
                  )}
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-paper-tint">
                    {i.images?.[0] ? <img src={i.images[0]} alt="" className="size-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.98rem] text-ink">{i.title}</p>
                    <p className="caption truncate">
                      {i.tag} · {i.year} · {i.images?.length ?? 0} img
                      {i.repoUrl ? " · repo" : ""}
                      {i.liveUrl ? " · live" : ""}
                      {i.featured ? " · featured" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(i)}
                      aria-label={`Edit ${i.title}`}
                      className="grid size-9 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-chrome-1/15"
                    >
                      <Pencil className="size-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => void remove(i.id)}
                      aria-label={`Delete ${i.title}`}
                      className="grid size-9 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-destructive/15"
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              ))}
              {!list(kind).length ? <li className="caption py-2">None yet.</li> : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- inbox ---------------- */

function InboxPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = useCallback(async () => {
    try {
      const db = await getDb();
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const snap = await getDocs(query(collection(db, "messages"), orderBy("createdAt", "desc")));
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) })));
    } catch (err) {
      console.error("[Admin] Could not load messages from Firestore:", err);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendReply(m: Message) {
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "messages", m.id), { replied: true, reply: replyText });
      window.location.href = `mailto:${m.email}?subject=${encodeURIComponent(
        `Re: your enquiry — Chetan Prajapat`,
      )}&body=${encodeURIComponent(replyText)}`;
      setReplyFor(null);
      setReplyText("");
      await load();
    } catch {
      toast.error("Could not save the reply.");
    }
  }

  async function remove(id: string) {
    const db = await getDb();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "messages", id));
    setMessages((p) => p.filter((m) => m.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="label">Messages ({messages.length})</span>
        <button onClick={() => void load()} className="press-btn-outline">
          <RefreshCw className="size-3.5" strokeWidth={1.5} /> Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {messages.map((m) => (
          <article key={m.id} className="plate p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-[1.05rem] text-ink">{m.name}</p>
                <p className="caption">
                  {m.email} {m.phone ? `· ${m.phone}` : ""}
                </p>
                {m.purpose || m.budget ? (
                  <p className="mt-2 flex flex-wrap gap-2">
                    {m.purpose ? (
                      <span className="rounded-full bg-chrome-2/20 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink">
                        {m.purpose}
                      </span>
                    ) : null}
                    {m.budget ? (
                      <span className="rounded-full bg-chrome-3/20 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink">
                        Budget: {m.budget}
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="caption">{new Date(m.createdAt).toLocaleString()}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]",
                    m.replied ? "bg-chrome-3/25 text-ink" : "bg-chrome-1/25 text-ink",
                  )}
                >
                  {m.replied ? "Replied" : "New"}
                </span>
              </div>
            </div>

            <p className="mt-4 text-[0.95rem] leading-[1.8] text-ink-soft">{m.message}</p>
            {m.reply ? <p className="caption mt-3">Your reply: {m.reply}</p> : null}

            {replyFor === m.id ? (
              <div className="mt-4">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply…"
                  className={cn(input, "resize-none")}
                />
                <div className="mt-3 flex gap-2">
                  <button onClick={() => void sendReply(m)} className="press-btn">
                    Send reply
                  </button>
                  <button onClick={() => setReplyFor(null)} className="press-btn-outline">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setReplyFor(m.id);
                    setReplyText("");
                  }}
                  className="press-btn"
                >
                  Reply
                </button>
                <button onClick={() => void remove(m.id)} className="press-btn-outline">
                  Delete
                </button>
              </div>
            )}
          </article>
        ))}
        {!messages.length ? <p className="caption">No messages yet.</p> : null}
      </div>
    </div>
  );
}


/* ---------------- reusable analytics table ---------------- */

type TableColumn = {
  header: string;
  align?: "left" | "right";
  width?: string;
  numeric?: boolean;
};

function DataTable({
  title,
  subtitle,
  columns,
  rows,
  empty = "No data yet.",
  maxHeight = "20rem",
  loading = false,
}: {
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  rows: { key: string; cells: React.ReactNode[] }[];
  empty?: string;
  maxHeight?: string;
  loading?: boolean;
}) {
  return (
    <div className="plate min-w-0 overflow-hidden p-4 sm:p-6">
      <span className="label">{title}</span>
      {subtitle ? <p className="caption mt-1">{subtitle}</p> : null}

      <div className="admin-table-scroll mt-4" style={{ maxHeight }}>
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.header}
                  scope="col"
                  className={c.align === "right" ? "text-right" : "text-left"}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows columns={columns.length} />
            ) : (
              rows.map((r) => (
                <tr key={r.key}>
                  {r.cells.map((cell, i) => (
                    <td
                      key={i}
                      className={cn(
                        columns[i]?.align === "right" ? "text-right" : "text-left",
                        columns[i]?.numeric ? "tabular-nums text-ink-soft" : "",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!loading && !rows.length ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <span className="empty-state-icon">
                      <BarChart3 className="size-5" strokeWidth={1.5} />
                    </span>
                    <p className="caption">{empty}</p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableSkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c}>
              <div
                className="skeleton"
                style={{
                  height: "0.85rem",
                  width: c === 0 ? "78%" : c === columns - 1 ? "60%" : "45%",
                  opacity: 1 - r * 0.12,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="plate p-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-4 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = "11rem" }: { height?: string }) {
  return (
    <div className="plate p-6">
      <div className="skeleton mb-4 h-4 w-32" />
      <div className="skeleton w-full rounded-lg" style={{ height }} />
    </div>
  );
}

function EmptyState({ message = "No data yet.", icon: Icon = BarChart3 }: { message?: string; icon?: typeof BarChart3 }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon className="size-5" strokeWidth={1.5} />
      </span>
      <p className="caption">{message}</p>
    </div>
  );
}

function readErrorMessage(err: unknown) {
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code.includes("permission-denied") || code.includes("unauthenticated"))
    return "Firestore rules block reading this collection. Allow authenticated reads for it in Firebase → Firestore → Rules.";
  if (code.includes("failed-precondition"))
    return "Firestore needs an index for this query. Open the browser console and follow the index link.";
  if (code.includes("unavailable")) return "Could not reach Firebase. Check your internet connection and retry.";
  return (err as Error | null)?.message || "Something went wrong while loading this data.";
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="plate mt-6 p-6">
      <p className="text-sm text-ink">{message}</p>
      <button onClick={onRetry} className="press-btn-outline mt-4">
        <RefreshCw className="size-3.5" strokeWidth={1.5} /> Try again
      </button>
    </div>
  );
}



function ShareBar({ value, peak }: { value: number; peak: number }) {
  return (
    <span className="block h-1 w-full min-w-16 rounded bg-ink/10">
      <span
        className="block h-1 rounded bg-gradient-to-r from-chrome-2 to-chrome-3"
        style={{ width: `${Math.max(2, (value / peak) * 100)}%` }}
      />
    </span>
  );
}

/* ---------------- google sheet analytics ---------------- */

function StatBlock({ title, rows }: { title: string; rows: SheetPair[] }) {
  const peak = Math.max(1, ...rows.map((r) => r.count));
  return (
    <DataTable
      title={title}
      columns={[
        { header: "Source", width: "45%" },
        { header: "Views", align: "right", numeric: true, width: "18%" },
        { header: "Share", width: "37%" },
      ]}
      rows={rows.slice(0, 12).map((r) => ({
        key: r.key || "direct",
        cells: [
          <span className="block max-w-[16rem] truncate text-ink" title={r.key || "direct"}>
            {r.key || "direct"}
          </span>,
          r.count,
          <ShareBar value={r.count} peak={peak} />,
        ],
      }))}
    />
  );
}


function SheetAnalyticsReport() {
  const [stats, setStats] = useState<SheetStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchSheetStats());
    } catch {
      setError("Could not reach the Google Sheet analytics endpoint.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const days = stats?.days ?? [];
  const peak = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="label">Google Sheet analytics</span>
          <p className="caption mt-1">Live counts from the Apps Script visit tracker · GA4 {GA_MEASUREMENT_ID}</p>
        </div>
        <button onClick={() => void load()} className="press-btn-outline" disabled={loading}>
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="caption text-red-600">{error}</p>
        </div>
      ) : null}

      {loading && !stats ? (
        <div className="mt-6 space-y-6">
          <StatCardSkeleton count={4} />
          <ChartSkeleton height="11rem" />
          <div className="grid gap-6 sm:grid-cols-2">
            <ChartSkeleton height="13rem" />
            <ChartSkeleton height="13rem" />
          </div>
          <ChartSkeleton height="14rem" />
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              { k: "Sheet total views", v: stats.total },
              { k: "Today", v: stats.today },
              { k: "Last 7 days", v: stats.last7 },
              { k: "Last 30 days", v: stats.month },
            ].map((s) => (
              <div key={s.k} className="plate p-5">
                <span className="label">{s.k}</span>
                <p className="mt-3 font-display text-[2rem] leading-none text-ink">
                  {typeof s.v === "number" ? s.v.toLocaleString() : "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="plate mt-6 p-6">
            <span className="label">Views by day</span>
            {days.length ? (
              <div className="admin-table-scroll mt-6 flex h-44 items-end gap-2 border-0 pb-1 sm:overflow-visible">
                {days.slice(-21).map((d) => (
                  <div key={d.key} className="flex min-w-6 flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-chrome-2 to-chrome-3"
                      style={{ height: `${(d.count / peak) * 100}%`, minHeight: d.count ? 4 : 2 }}
                      title={`${d.key}: ${d.count}`}
                    />
                    <span className="caption text-[0.55rem]">{d.key}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No daily view data yet." />
            )}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <StatBlock title="Top pages" rows={stats.pages} />
            <StatBlock title="Top referrers" rows={stats.referrers} />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {stats.devices.length ? <StatBlock title="Platforms" rows={stats.devices} /> : null}
            <DataTable
              title="Recent visits"
              columns={[
                { header: "Page", width: "34%" },
                { header: "When", width: "30%" },
                { header: "Referrer", width: "22%" },
                { header: "Platform", width: "14%" },
              ]}
              empty="No recent visits recorded."
              rows={stats.recent.slice(0, 40).map((v, i) => ({
                key: `${v.time}-${i}`,
                cells: [
                  <span className="block max-w-[12rem] truncate" title={v.page || "/"}>
                    {v.page || "/"}
                  </span>,
                  <span className="whitespace-nowrap text-ink-soft">{new Date(v.time).toLocaleString()}</span>,
                  <span className="block max-w-[10rem] truncate text-ink-soft">{v.ref || "direct"}</span>,
                  <span className="whitespace-nowrap text-ink-soft">{deviceFromUa(v.ua)}</span>,
                ],
              }))}
            />

          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---------------- traffic ---------------- */

type Visit = { path: string; visitor: string; referrer: string; createdAt: number };

function TrafficPanel() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDb();
      const { collection, getDocs, orderBy, query, limit } = await import("firebase/firestore");
      const snap = await getDocs(query(collection(db, "visits"), orderBy("createdAt", "desc"), limit(2000)));
      setVisits(snap.docs.map((d) => d.data() as Visit));
    } catch (err) {
      console.error("[admin] traffic load failed", err);
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);


  const stats = useMemo(() => {
    const day = 86_400_000;
    const now = Date.now();
    const unique = new Set(visits.map((v) => v.visitor)).size;
    const last7 = visits.filter((v) => now - v.createdAt < 7 * day).length;
    const today = visits.filter((v) => now - v.createdAt < day).length;

    const byPath = new Map<string, number>();
    const byRef = new Map<string, number>();
    for (const v of visits) {
      byPath.set(v.path, (byPath.get(v.path) ?? 0) + 1);
      byRef.set(v.referrer || "direct", (byRef.get(v.referrer || "direct") ?? 0) + 1);
    }

    const days: { label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const start = now - (i + 1) * day;
      const end = now - i * day;
      days.push({
        label: new Date(end).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
        count: visits.filter((v) => v.createdAt >= start && v.createdAt < end).length,
      });
    }

    const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { total: visits.length, unique, last7, today, paths: top(byPath), refs: top(byRef), days };
  }, [visits]);

  const peak = Math.max(1, ...stats.days.map((d) => d.count));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="label">Website traffic</span>
        <button onClick={() => void load()} className="press-btn-outline" disabled={loading}>
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-6">
          <StatCardSkeleton count={4} />
          <ChartSkeleton height="11rem" />
          <div className="grid gap-6 sm:grid-cols-2">
            <ChartSkeleton height="13rem" />
            <ChartSkeleton height="13rem" />
          </div>
        </div>
      ) : error ? (
        <ErrorNotice message={error} onRetry={() => void load()} />
      ) : (

        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              { k: "Total views", v: stats.total },
              { k: "Unique visitors", v: stats.unique },
              { k: "Last 7 days", v: stats.last7 },
              { k: "Today", v: stats.today },
            ].map((s) => (
              <div key={s.k} className="plate p-5">
                <span className="label">{s.k}</span>
                <p className="mt-3 font-display text-[2rem] leading-none text-ink">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="plate mt-6 p-6">
            <span className="label">Last 14 days</span>
            {stats.days.some((d) => d.count > 0) ? (
              <div className="admin-table-scroll mt-6 flex h-44 items-end gap-2 border-0 pb-1 sm:overflow-visible">
                {stats.days.map((d) => (
                  <div key={d.label} className="flex min-w-6 flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-chrome-2 to-chrome-3"
                      style={{ height: `${(d.count / peak) * 100}%`, minHeight: d.count ? 4 : 2 }}
                      title={`${d.label}: ${d.count}`}
                    />
                    <span className="caption text-[0.55rem]">{d.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No visits in the last 14 days." />
            )}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {[
              { title: "Top pages", rows: stats.paths },
              { title: "Top referrers", rows: stats.refs },
            ].map((block) => {
              const blockPeak = Math.max(1, ...block.rows.map(([, v]) => v));
              return (
                <DataTable
                  key={block.title}
                  title={block.title}
                  columns={[
                    { header: block.title === "Top pages" ? "Page" : "Referrer", width: "45%" },
                    { header: "Views", align: "right", numeric: true, width: "18%" },
                    { header: "Share", width: "37%" },
                  ]}
                  empty={block.title === "Top pages" ? "No page views recorded yet." : "No referrer data yet."}
                  rows={block.rows.map(([k, v]) => ({
                    key: k,
                    cells: [
                      <span className="block max-w-[16rem] truncate" title={k}>
                        {k}
                      </span>,
                      v,
                      <ShareBar value={v} peak={blockPeak} />,
                    ],
                  }))}
                />
              );
            })}
          </div>
        </>
      )}

      <SheetAnalyticsReport />

      <DownloadsReport />
    </div>
  );
}

/* ---------------- download events ---------------- */

function DownloadsReport() {
  const [events, setEvents] = useState<DownloadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await fetchDownloads());
    } catch (err) {
      console.error("[admin] downloads load failed", err);
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const day = 86_400_000;
    const now = Date.now();
    const byItem = new Map<string, { title: string; count: number; unique: Set<string> }>();
    for (const e of events) {
      const row = byItem.get(e.slug) ?? { title: e.title || e.slug, count: 0, unique: new Set<string>() };
      row.count += 1;
      row.unique.add(e.visitor);
      byItem.set(e.slug, row);
    }
    const days: { label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const start = now - (i + 1) * day;
      const end = now - i * day;
      days.push({
        label: new Date(end).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
        count: events.filter((e) => e.createdAt >= start && e.createdAt < end).length,
      });
    }
    return {
      total: events.length,
      last7: events.filter((e) => now - e.createdAt < 7 * day).length,
      today: events.filter((e) => now - e.createdAt < day).length,
      items: [...byItem.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 10),
      days,
      recent: events.slice(0, 12),
    };
  }, [events]);

  const peak = Math.max(1, ...stats.days.map((d) => d.count));

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <span className="label">App / file downloads</span>
        <button onClick={() => void load()} className="press-btn-outline" disabled={loading}>
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-6">
          <StatCardSkeleton count={3} />
          <ChartSkeleton height="9rem" />
          <div className="grid gap-6 sm:grid-cols-2">
            <ChartSkeleton height="13rem" />
            <ChartSkeleton height="13rem" />
          </div>
        </div>
      ) : error ? (
        <ErrorNotice message={error} onRetry={() => void load()} />
      ) : (

        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { k: "Total downloads", v: stats.total },
              { k: "Last 7 days", v: stats.last7 },
              { k: "Today", v: stats.today },
            ].map((s) => (
              <div key={s.k} className="plate p-5">
                <span className="label">{s.k}</span>
                <p className="mt-3 font-display text-[2rem] leading-none text-ink">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="plate mt-6 p-6">
            <span className="label">Downloads · last 14 days</span>
            {stats.days.some((d) => d.count > 0) ? (
              <div className="admin-table-scroll mt-6 flex h-36 items-end gap-2 border-0 pb-1 sm:overflow-visible">
                {stats.days.map((d) => (
                  <div key={d.label} className="flex min-w-6 flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-chrome-1 to-chrome-2"
                      style={{ height: `${(d.count / peak) * 100}%`, minHeight: d.count ? 4 : 2 }}
                      title={`${d.label}: ${d.count}`}
                    />
                    <span className="caption text-[0.55rem]">{d.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No downloads in the last 14 days." />
            )}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <DataTable
              title="Most downloaded"
              columns={[
                { header: "Item", width: "52%" },
                { header: "Downloads", align: "right", numeric: true, width: "24%" },
                { header: "Users", align: "right", numeric: true, width: "24%" },
              ]}
              empty="No downloads recorded yet."
              rows={stats.items.map(([slug, row]) => ({
                key: slug,
                cells: [
                  <span className="block max-w-[14rem] truncate" title={row.title}>
                    {row.title}
                  </span>,
                  row.count,
                  row.unique.size,
                ],
              }))}
            />

            <DataTable
              title="Recent activity"
              columns={[
                { header: "Item", width: "30%" },
                { header: "When", width: "28%" },
                { header: "Referrer", width: "22%" },
                { header: "Path", width: "20%" },
              ]}
              empty="Nothing downloaded yet."
              rows={stats.recent.map((e, i) => ({
                key: `${e.slug}-${e.createdAt}-${i}`,
                cells: [
                  <span className="block max-w-[11rem] truncate" title={e.title}>
                    {e.title}
                  </span>,
                  <span className="whitespace-nowrap text-ink-soft">{new Date(e.createdAt).toLocaleString()}</span>,
                  <span className="block max-w-[9rem] truncate text-ink-soft">{e.referrer || "direct"}</span>,
                  <span className="block max-w-[9rem] truncate text-ink-soft">{e.path}</span>,
                ],
              }))}
            />
          </div>
        </>
      )}

    </div>
  );
}


/* ---------------- shell ---------------- */

function AdminPage() {
  const { dark, toggle: toggleTheme } = useTheme();
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("content");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setChecked(true);
      return;
    }
    let unsub = () => {};
    void (async () => {
      const auth = await getAuthClient();
      const { onAuthStateChanged, signOut } = await import("firebase/auth");
      unsub = onAuthStateChanged(auth, (u) => {
        if (u && !isAdminEmail(u.email)) {
          setUser(null);
          setChecked(true);
          void signOut(auth);
          return;
        }
        setUser(u?.email ?? null);
        setChecked(true);
      });

    })();
    return () => unsub();
  }, []);

  async function signOutNow() {
    const auth = await getAuthClient();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="admin-shell min-h-screen px-5 py-16 sm:px-8">
        <SetupNotice />
      </div>
    );
  }

  if (!checked) {
    return (
      <div className="admin-shell relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px] dark:bg-violet-400/5" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-400/5" />

        <div className="relative flex flex-col items-center gap-6 text-center">
          {/* Glowing Animated Spinner */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-violet-500/10 border-t-violet-500 dark:border-violet-400/10 dark:border-t-violet-400" />
            {/* Inner reversing ring */}
            <div className="absolute h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/10 border-b-indigo-500 [animation-direction:reverse] [animation-duration:1.2s] dark:border-indigo-400/10 dark:border-b-indigo-400" />
            {/* Pulsing center dot */}
            <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 shadow-md shadow-violet-500/30" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-ink">
              Verifying Session
            </h2>
            <p className="font-mono text-[10px] tracking-widest text-ink-soft/75 animate-pulse [animation-duration:1.5s]">
              Securing connection to console...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const tabs: { id: Tab; label: string; hint: string; icon: typeof LayoutGrid }[] = [
    { id: "content", label: "Content", hint: "Projects & apps", icon: LayoutGrid },
    { id: "arcade", label: "Arcade", hint: "Timer & Bans", icon: Gamepad2 },
    { id: "blog", label: "Blog", hint: "Posts & drafts", icon: PenLine },
    { id: "credentials", label: "Credentials", hint: "Certificates", icon: Award },
    { id: "resume", label: "Resume", hint: "Editor + PDF", icon: FileText },
    { id: "inbox", label: "Inbox", hint: "Messages", icon: Inbox },
    { id: "traffic", label: "Traffic", hint: "Visitors", icon: BarChart3 },
  ];

  const activeTab = tabs.find((t) => t.id === tab)!;

  return (
    <div className="admin-shell min-h-screen bg-paper text-ink transition-colors duration-300">
      <div className="mx-auto grid w-full max-w-[92rem] gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-10 lg:py-12 xl:grid-cols-[16rem_minmax(0,1fr)] xl:px-12">
        {/* sidebar */}
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <div className="plate overflow-hidden p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-chrome-2 to-chrome-3 font-display text-[1.1rem] text-white">
                C
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.98rem] text-ink">Control room</p>
                <p className="caption truncate">{user}</p>
              </div>
            </div>

            <nav className="mt-6 grid gap-1.5 overflow-hidden">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    tab === t.id ? "bg-chrome-1/12 text-ink" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                      tab === t.id ? "border-transparent bg-gradient-to-br from-chrome-2 to-chrome-3 text-white" : "border-ink/12",
                    )}
                  >
                    <t.icon className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[0.66rem] uppercase tracking-[0.16em]">{t.label}</span>
                    <span className="caption block truncate text-[0.66rem]">{t.hint}</span>
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-6 grid gap-2 border-t border-ink/10 pt-5">
              <button onClick={toggleTheme} className="press-btn-outline justify-center">
                {dark ? <Sun className="size-3.5" strokeWidth={1.5} /> : <Moon className="size-3.5" strokeWidth={1.5} />}
                {dark ? "Light Mode" : "Dark Mode"}
              </button>
              <Link to="/" className="press-btn-outline justify-center">
                View site
              </Link>
              <button onClick={() => void signOutNow()} className="press-btn-outline justify-center">
                <LogOut className="size-3.5" strokeWidth={1.5} /> Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* main */}
        <main className="min-w-0">
          <header className="plate grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden p-4 sm:items-end sm:gap-5 sm:p-7">
            <div className="min-w-0">
              <span className="label">{activeTab.hint}</span>
              <h1 className="mt-2 truncate font-display leading-none sm:mt-3">
                {activeTab.label} <span className="chrome-text">studio</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-xs font-mono font-medium text-ink transition hover:bg-ink hover:text-paper"
                title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                {dark ? "Light" : "Dark"}
              </button>
              <span className="shrink-0 rounded-full border border-ink/12 bg-paper px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-ink-soft sm:px-3 sm:py-1.5">
                {isFirebaseConfigured ? "Live" : "Local"}
              </span>
            </div>
          </header>




          <div className="mt-6 sm:mt-8">
            {tab === "content" ? (
              <ErrorBoundary>
                <ContentManager />
              </ErrorBoundary>
            ) : null}
            {tab === "arcade" ? (
              <ErrorBoundary>
                <ArcadeControlManager />
              </ErrorBoundary>
            ) : null}
            {tab === "blog" ? (
              <ErrorBoundary>
                <BlogManager />
              </ErrorBoundary>
            ) : null}
            {tab === "credentials" ? (
              <ErrorBoundary>
                <CredentialsManager />
              </ErrorBoundary>
            ) : null}
            {tab === "resume" ? (
              <ErrorBoundary>
                <ResumeManager />
              </ErrorBoundary>
            ) : null}
            {tab === "inbox" ? (
              <ErrorBoundary>
                <InboxPanel />
              </ErrorBoundary>
            ) : null}
            {tab === "traffic" ? (
              <ErrorBoundary>
                <TrafficPanel />
              </ErrorBoundary>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
