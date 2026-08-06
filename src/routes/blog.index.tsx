import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, Star } from "lucide-react";
import { PageHero, SiteShell } from "@/components/site/shell";
import { Reveal, Rule } from "@/components/site/primitives";
import { formatPostDate, postCategories, usePosts, type Post } from "@/lib/blog";
import { cn } from "@/lib/utils";

const title = "Blog — Thoughts & Code | Chetan Prajapat";
const description =
  "Dev tips, project breakdowns and career stories written by Chetan Prajapat — real lessons from building full stack products.";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
});

function Cover({ post, className }: { post: Post; className?: string }) {
  if (post.cover) {
    return (
      <img
        loading="lazy"
        decoding="async"
        src={post.cover}
        alt={post.title}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center bg-gradient-to-br from-chrome-1/20 via-chrome-2/15 to-chrome-3/20",
        className,
      )}
    >
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-ink-soft">{post.category}</span>
    </div>
  );
}

function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <Reveal delay={index * 0.05}>
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="plate group grid gap-5 overflow-hidden p-4 transition-transform duration-500 hover:-translate-y-1 sm:grid-cols-[13rem_minmax(0,1fr)] sm:p-5"
      >
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-ink/10 sm:aspect-[5/4]">
          <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.05]">
            <Cover post={post} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="label">{post.category}</span>
            {post.featured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-chrome-1/50 bg-chrome-1/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ink">
                <Star className="size-3" strokeWidth={1.6} /> Featured
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-[clamp(1.35rem,2.4vw,1.9rem)] leading-[1.1]">{post.title}</h2>
          <p className="mt-3 max-w-[52ch] text-[0.98rem] leading-[1.8] text-ink-soft">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 pt-4">
            <span className="caption">{formatPostDate(post.date)}</span>
            <span className="caption">{post.readMins} min read</span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink">
              Read <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.6} />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

function BlogIndex() {
  const { posts } = usePosts();
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      const okCat = cat === "All" || p.category === cat;
      const okQ =
        !needle ||
        p.title.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.toLowerCase().includes(needle));
      return okCat && okQ;
    });
  }, [posts, cat, q]);

  const topics = new Set(posts.map((p) => p.category)).size;
  const reads = posts.reduce((sum, p) => sum + p.readMins, 0);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Blog"
        title="Thoughts & code."
        lead="Dev tips, project breakdowns, career stories and things I learned the hard way. Real content by a real developer."
        meta={[`${posts.length} posts`, `${topics} topics`, `${reads} min of reading`]}
      />

      <section className="relative z-10 px-5 pb-24 sm:px-8 lg:px-14">
        <div className="mx-auto w-full max-w-[84rem]">
          <div className="flex flex-wrap items-center gap-3">
            {["All", ...postCategories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-4 py-2 font-mono text-[0.64rem] uppercase tracking-[0.16em] transition-colors",
                  cat === c
                    ? "border-transparent bg-ink text-paper"
                    : "border-ink/12 bg-paper/60 text-ink-soft backdrop-blur hover:text-ink",
                )}
              >
                {c}
              </button>
            ))}
            <label className="ml-auto flex min-w-[14rem] flex-1 items-center gap-2 rounded-full border border-ink/12 bg-paper/60 px-4 py-2.5 backdrop-blur sm:max-w-xs sm:flex-none">
              <Search className="size-3.5 text-ink-soft" strokeWidth={1.6} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search posts…"
                className="w-full bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-ink-soft/70"
              />
            </label>
          </div>

          <Rule className="mt-7" />

          <div className="mt-8 grid gap-6">
            {filtered.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
            {!filtered.length ? (
              <p className="caption py-16 text-center">Nothing here yet — try another topic.</p>
            ) : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
