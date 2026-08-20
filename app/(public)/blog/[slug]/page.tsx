import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_URL, SITE_NAME, storageUrl } from "@/lib/constants";
import {
  categoryLabel, deriveExcerpt, extractHeadings, formatPostDate, renderMarkdown,
  type BlogPost,
} from "@/lib/blog";

export const revalidate = 120;

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    return (data as BlogPost) ?? null;
  } catch {
    return null;
  }
}

async function getMorePosts(excludeId: string) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, reading_minutes, published_at")
      .eq("status", "published")
      .is("deleted_at", null)
      .neq("id", excludeId)
      .order("published_at", { ascending: false })
      .limit(3);
    return (data ?? []) as Array<Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "category" | "reading_minutes" | "published_at">>;
  } catch {
    return [];
  }
}

function coverSrc(path: string): string {
  return path.startsWith("http") ? path : storageUrl(`event-images/${path}`, { width: 1200, quality: 78 });
}

/** Pre-render every published post so crawlers get static HTML, not a spinner. */
export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("status", "published")
      .is("deleted_at", null);
    return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found", robots: { index: false, follow: false } };

  const title       = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || deriveExcerpt(post.content, 160);
  const image       = post.cover_image ? coverSrc(post.cover_image) : "/opengraph-image";

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags?.length ? post.tags : undefined,
    openGraph: {
      type:          "article",
      title,
      description,
      url:           `${SITE_URL}/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime:  post.updated_at,
      authors:       [post.author_name],
      images:        [{ url: image, width: 1200, height: 630, alt: post.cover_alt ?? post.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [html, headings, more] = await Promise.all([
    Promise.resolve(renderMarkdown(post.content)),
    Promise.resolve(extractHeadings(post.content)),
    getMorePosts(post.id),
  ]);

  const description = post.meta_description || post.excerpt || deriveExcerpt(post.content, 160);
  const image = post.cover_image ? coverSrc(post.cover_image) : `${SITE_URL}/opengraph-image`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": description,
    "image": [image],
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "author": { "@type": "Organization", "name": post.author_name, "url": SITE_URL },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon.svg` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
    "articleSection": categoryLabel(post.category),
    "wordCount": post.content.trim().split(/\s+/).length,
    ...(post.tags?.length ? { "keywords": post.tags.join(", ") } : {}),
  };

  // Breadcrumbs give Google the Home > Blog > Post path it shows above a result.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Header */}
      <section className="relative bg-forest overflow-hidden pt-28 pb-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(201,162,74,0.10),transparent)]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <FadeIn>
            {/* Visible breadcrumb, matching the structured data above */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-cream/40">
              <Link href="/" className="hover:text-gold transition-colors">Home</Link>
              <span aria-hidden>/</span>
              <Link href="/blog" className="hover:text-gold transition-colors">Blog</Link>
            </nav>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-cream/45 mt-6">
              <span className="text-gold">{categoryLabel(post.category)}</span>
              <span aria-hidden>·</span>
              <span>{formatPostDate(post.published_at)}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />{post.reading_minutes} min read
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-cream mt-4 leading-[1.02] text-balance">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-cream/60 mt-5 text-lg leading-relaxed">{post.excerpt}</p>
            )}

            <p className="text-[11px] uppercase tracking-widest text-cream/35 mt-7">
              By {post.author_name}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Cover */}
      {post.cover_image && (
        <div className="bg-forest">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden translate-y-8 shadow-2xl">
              <Image
                src={coverSrc(post.cover_image)}
                alt={post.cover_alt ?? ""}
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 60vw"
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <section className={`bg-off-white pb-20 ${post.cover_image ? "pt-24" : "pt-16"}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {headings.length >= 3 && (
            <nav aria-label="On this page" className="mb-12 border-l-2 border-gold/40 pl-5">
              <p className="text-[10px] uppercase tracking-widest text-charcoal/35 mb-2">On this page</p>
              <ul className="flex flex-col gap-1.5">
                {headings.map(h => (
                  <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
                    <a href={`#${h.id}`} className="text-sm text-charcoal/60 hover:text-forest transition-colors">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <article className="article-body" dangerouslySetInnerHTML={{ __html: html }} />

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-mist">
              {post.tags.map(t => (
                <span key={t} className="text-[11px] uppercase tracking-widest text-charcoal/45 bg-mist/60 rounded px-3 py-1.5">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/60 hover:text-forest transition-colors"
            >
              <ArrowLeft size={15} />
              All posts
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-forest text-cream text-sm font-medium px-5 py-3 rounded hover:bg-moss transition-colors"
            >
              Join the next session
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* More posts */}
      {more.length > 0 && (
        <section className="bg-cream-dark/40 py-16 border-t border-mist">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="label-caps text-charcoal/35">Keep reading</p>
            <div className="grid sm:grid-cols-3 gap-8 mt-6">
              {more.map(p => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-gold">
                    {categoryLabel(p.category)}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-charcoal mt-1.5 leading-snug text-balance group-hover:text-forest transition-colors">
                    {p.title}
                  </h3>
                  <span className="text-[11px] text-charcoal/35 mt-2">
                    {formatPostDate(p.published_at)} · {p.reading_minutes} min
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
