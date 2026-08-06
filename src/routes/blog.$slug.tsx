import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteShell } from "@/components/site/shell";
import { Reveal, Rule } from "@/components/site/primitives";
import { formatPostDate, parseBody, usePosts } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    const title = `${name.charAt(0).toUpperCase()}${name.slice(1)} — Blog | Chetan Prajapat`;
    const description = `A post by Chetan Prajapat on ${name} — dev notes, build breakdowns and lessons from real projects.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
});

function PostPage() {
  const { slug } = Route.useParams();
  const { posts } = usePosts();
  const post = posts.find((p) => p.slug === slug);
  const others = posts.filter((p) => p.slug !== slug).slice(0, 3);

  if (!post) {
    return (
      <SiteShell>
        <section className="relative z-10 px-5 pb-24 pt-40 sm:px-8 lg:px-14">
          <div className="mx-auto w-full max-w-[60rem]">
            <span className="label">Blog</span>
            <h1 className="mt-5 text-[clamp(2.2rem,5vw,3.4rem)]">Post not found.</h1>
            <p className="mt-5 text-ink-soft">This post may have been renamed or unpublished.</p>
            <Link to="/blog" className="press-btn mt-8">
              <ArrowLeft className="size-3.5" strokeWidth={1.5} /> Back to blog
            </Link>
          </div>
        </section>
      </SiteShell>
    );
  }

  const blocks = parseBody(post.body);

  return (
    <SiteShell>
      <article className="relative z-10 px-5 pb-24 pt-32 sm:px-8 md:pt-40 lg:px-14">
        <div className="mx-auto w-full max-w-[52rem]">
          <Link to="/blog" className="caption inline-flex items-center gap-2 hover:text-ink">
            <ArrowLeft className="size-3.5" strokeWidth={1.6} /> All posts
          </Link>

          <span className="label mt-8 block">{post.category}</span>
          <h1 className="mt-4 text-[clamp(2.3rem,6vw,4rem)] leading-[1.02]">{post.title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="caption">{formatPostDate(post.date)}</span>
            <span className="caption">{post.readMins} min read</span>
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-ink/12 bg-paper/60 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-soft backdrop-blur"
              >
                {t}
              </span>
            ))}
          </div>

          {post.cover ? (
            <Reveal className="mt-10">
              <img
                loading="lazy"
                decoding="async"
                src={post.cover}
                alt={post.title}
                className="aspect-[16/9] w-full rounded-2xl border border-ink/10 object-cover"
              />
            </Reveal>
          ) : null}

          <Rule className="mt-10" />

          {post.excerpt ? (
            <p className="mt-10 text-[1.15rem] leading-[1.85] text-ink">{post.excerpt}</p>
          ) : null}

          <div className="mt-6 grid gap-6">
            {blocks.map((b, i) =>
              b.type === "heading" ? (
                <Reveal key={i} delay={0.03}>
                  <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.1rem)] leading-tight">{b.text}</h2>
                </Reveal>
              ) : (
                <Reveal key={i} delay={0.03}>
                  <p className="text-[1.02rem] leading-[1.9] text-ink-soft">{b.text}</p>
                </Reveal>
              ),
            )}
          </div>

          {others.length ? (
            <div className="mt-16 border-t border-ink/10 pt-10">
              <span className="label">Read next</span>
              <div className="mt-6 grid gap-4">
                {others.map((p) => (
                  <Link
                    key={p.slug}
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="plate group flex items-center gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[1.05rem] text-ink">{p.title}</p>
                      <p className="caption truncate">
                        {p.category} · {p.readMins} min read
                      </p>
                    </div>
                    <ArrowUpRight
                      className="ml-auto size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={1.6}
                    />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </SiteShell>
  );
}
