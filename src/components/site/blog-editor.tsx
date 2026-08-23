import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Pencil, Plus, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import {
  defaultPosts,
  emptyPost,
  fetchPosts,
  formatPostDate,
  postCategories,
  removePost,
  savePost,
  slugify,
  type Post,
} from "@/lib/blog";
import { uploadImage } from "@/lib/firebase";
import { cn } from "@/lib/utils";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {hint ? <span className="caption mt-1 block">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

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
    <section className="plate p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-ink/12 font-mono text-[0.66rem] text-ink-soft">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[1.15rem] leading-tight">{title}</h3>
          <p className="caption mt-1 max-w-[42ch]">{hint}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

/** Helper to convert file to base64 if Firebase Storage upload fails */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Admin tab: write, edit, publish and delete blog posts. */
export function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<Post>(emptyPost);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await fetchPosts();
    setPosts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (p: Partial<Post>) => setForm((f) => ({ ...f, ...p }));

  function reset() {
    setForm({ ...emptyPost, date: new Date().toISOString().slice(0, 10) });
    setEditingSlug(null);
  }

  function edit(post: Post) {
    setForm({ ...post });
    setEditingSlug(post.slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pickCover(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      try {
        const url = await uploadImage(file, "blog");
        patch({ cover: url });
        toast.success("Cover uploaded to Storage.");
      } catch {
        const base64 = await fileToBase64(file);
        patch({ cover: base64 });
        toast.success("Cover image attached.");
      }
    } catch {
      toast.error("Image attachment failed.");
    } finally {
      setUploading(false);
    }
  }

  async function seedDefaults() {
    setBusy(true);
    try {
      for (const p of defaultPosts) {
        await savePost(p);
      }
      toast.success("3 Starter posts published live to Firestore!");
      await load();
    } catch {
      toast.error("Failed to seed posts.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    const slug = form.slug.trim() || slugify(form.title);
    if (!form.title.trim() || !slug) {
      toast.error("Add a title first.");
      return;
    }
    const next: Post = { ...form, slug, tags: form.tags.filter(Boolean) };
    setBusy(true);
    try {
      await savePost(next);
      toast.success(editingSlug ? "Post updated — live on /blog." : "Post published — live on /blog.");
      reset();
      await load();
    } catch {
      toast.error("Save failed — check Firestore rules for “posts”.");
    } finally {
      setBusy(false);
    }
  }

  async function destroy(slug: string) {
    if (!window.confirm("Delete this post?")) return;
    try {
      await removePost(slug);
      toast.success("Post deleted.");
      if (editingSlug === slug) reset();
      await load();
    } catch {
      toast.error("Delete failed.");
    }
  }

  const wordCount = useMemo(() => form.body.trim().split(/\s+/).filter(Boolean).length, [form.body]);

  return (
    <div className="grid gap-7 xl:grid-cols-12">
      {/* editor */}
      <div className="grid gap-5 xl:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label">{editingSlug ? `Editing “${editingSlug}”` : "New post"}</p>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="press-btn-outline">
              <RefreshCw className="size-3.5" strokeWidth={1.5} /> Reload
            </button>
            {editingSlug ? (
              <button onClick={reset} className="press-btn-outline">
                <Plus className="size-3.5" strokeWidth={1.5} /> New post
              </button>
            ) : null}
          </div>
        </div>

        <Step n={1} title="Headline" hint="The title people see in the list and at the top of the post.">
          <Field label="Title" hint="Write it like a sentence, not a keyword list.">
            <input
              value={form.title}
              onChange={(e) =>
                patch({ title: e.target.value, ...(editingSlug ? {} : { slug: slugify(e.target.value) }) })
              }
              placeholder="How I built my portfolio website"
              className="admin-field"
            />
          </Field>
          <Field label="Slug" hint="The page address: /blog/your-slug. Filled in automatically.">
            <input
              value={form.slug}
              onChange={(e) => patch({ slug: slugify(e.target.value) })}
              placeholder="how-i-built-my-portfolio"
              className="admin-field"
            />
          </Field>
          <Field label="Short summary" hint="One or two lines shown on the blog card.">
            <textarea
              value={form.excerpt}
              onChange={(e) => patch({ excerpt: e.target.value })}
              rows={3}
              placeholder="A few lines describing what the reader will learn…"
              className="admin-field text-[0.92rem]"
            />
          </Field>
        </Step>

        <Step n={2} title="Details" hint="Category, date and reading time for the card.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => patch({ category: e.target.value })}
                className="admin-field"
              >
                {postCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date" hint="YYYY-MM-DD">
              <input
                type="date"
                value={form.date}
                onChange={(e) => patch({ date: e.target.value })}
                className="admin-field"
              />
            </Field>
            <Field label="Read time" hint="In minutes">
              <input
                type="number"
                min={1}
                max={60}
                value={form.readMins}
                onChange={(e) => patch({ readMins: Math.max(1, Number(e.target.value) || 1) })}
                className="admin-field"
              />
            </Field>
          </div>
          <Field label="Tags" hint="Comma-separated keywords, e.g. React, Firebase, Motion">
            <input
              value={form.tags.join(", ")}
              onChange={(e) =>
                patch({
                  tags: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="React, Architecture, UI"
              className="admin-field"
            />
          </Field>
        </Step>

        <Step
          n={3}
          title="Cover image"
          hint="Pick a file or paste a direct image URL for the article banner."
        >
          <div className="space-y-3">
            <label className="grid cursor-pointer place-items-center gap-2 rounded-2xl border border-dashed border-ink/20 bg-paper px-5 py-8 text-center transition-colors hover:border-chrome-1/60">
              <ImagePlus className="size-5 text-ink-soft" strokeWidth={1.5} />
              <span className="text-[0.95rem] text-ink">{uploading ? "Attaching image…" : "Click to choose a cover file"}</span>
              <span className="caption">JPG, PNG, WebP · optional</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void pickCover(e.target.files?.[0] ?? null)}
              />
            </label>
            <Field label="Or paste image URL directly">
              <input
                value={form.cover ?? ""}
                onChange={(e) => patch({ cover: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="admin-field font-mono text-[0.8rem]"
              />
            </Field>
          </div>
          {form.cover ? (
            <div className="flex items-center gap-4 pt-2">
              <img src={form.cover} alt="" className="size-20 rounded-xl border border-ink/10 object-cover" />
              <button type="button" onClick={() => patch({ cover: "" })} className="press-btn-outline">
                <Trash2 className="size-3.5" strokeWidth={1.5} /> Remove cover
              </button>
            </div>
          ) : (
            <p className="caption">No cover yet — the card will show a modern tinted gradient panel.</p>
          )}
        </Step>

        <Step
          n={4}
          title="The post"
          hint="Leave a blank line between paragraphs. Start a line with ## to make it a heading."
        >
          <Field label="Body" hint={`${wordCount} words`}>
            <textarea
              value={form.body}
              onChange={(e) => patch({ body: e.target.value })}
              rows={16}
              placeholder={"Intro paragraph…\n\n## A heading\nMore of the story…"}
              className="admin-field font-mono text-[0.85rem] leading-relaxed"
            />
          </Field>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 rounded-xl border border-ink/12 bg-paper px-3.5 py-2.5 text-[0.9rem]">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => patch({ published: e.target.checked })}
              />
              Published (visible on the site)
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-ink/12 bg-paper px-3.5 py-2.5 text-[0.9rem]">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => patch({ featured: e.target.checked })}
              />
              Feature at the top
            </label>
          </div>
        </Step>

        <button onClick={() => void publish()} disabled={busy} className="press-btn justify-center disabled:opacity-50">
          <Upload className="size-3.5" strokeWidth={1.5} />
          {busy ? "Saving…" : editingSlug ? "Update post" : "Publish post"}
        </button>
      </div>

      {/* list */}
      <div className="min-w-0 xl:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <p className="label">Posts ({posts.length})</p>
          {posts.length === 0 && !loading ? (
            <button onClick={() => void seedDefaults()} disabled={busy} className="press-btn-outline text-[0.75rem] gap-1.5 py-1 px-3">
              <Sparkles className="size-3" strokeWidth={1.5} /> Seed 3 Starter Posts
            </button>
          ) : null}
        </div>
        {loading ? <p className="caption mt-3">Loading…</p> : null}
        <div className="mt-4 grid gap-3">
          {posts.map((p) => (
            <div key={p.slug} className="plate flex items-center gap-3 p-3">
              {p.cover ? (
                <img src={p.cover} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-chrome-1/12 font-mono text-[0.6rem] text-ink-soft">
                  {p.category.slice(0, 3).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.95rem] text-ink">{p.title}</p>
                <p className="caption truncate">
                  {p.category} · {formatPostDate(p.date)} · {p.readMins} min
                  {p.featured ? " · featured" : ""}
                  {p.published ? "" : " · draft"}
                </p>
              </div>
              <button onClick={() => edit(p)} title="Edit" className="press-btn-outline px-2.5">
                <Pencil className="size-3.5" strokeWidth={1.5} />
              </button>
              <button onClick={() => void destroy(p.slug)} title="Delete" className="press-btn-outline px-2.5">
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
          {!posts.length && !loading ? (
            <div className="plate p-6 text-center space-y-3">
              <p className="caption">No posts yet — write your first post or click below to populate 3 starter articles.</p>
              <button onClick={() => void seedDefaults()} disabled={busy} className="press-btn text-[0.8rem] gap-2 mx-auto">
                <Sparkles className="size-3.5" strokeWidth={1.5} /> Seed Starter Posts
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
