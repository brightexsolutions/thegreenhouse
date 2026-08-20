import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, PenLine } from "lucide-react";
import { FadeIn, FadeInStagger, StaggerChild } from "@/components/motion/fade-in";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_URL, storageUrl } from "@/lib/constants";
import { categoryLabel, formatPostDate, type BlogPost } from "@/lib/blog";

// Short window so a freshly published post reaches the index and the sitemap
// quickly. Search engines only find posts they can see.
export const revalidate = 120;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing from The Green House: reflections on worship, session recaps, and notes from a cross-church community in Nairobi, Kenya.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | The Green House",
    description: "Reflections, session recaps, and notes from The Green House worship community in Nairobi.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

type IndexPost = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "cover_image" | "cover_alt" |
  "author_name" | "category" | "reading_minutes" | "published_at"
>;

async function getPosts(): Promise<IndexPost[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image, cover_alt, author_name, category, reading_minutes, published_at")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false });
    return (data ?? []) as IndexPost[];
  } catch {
    return [];
  }
}

function coverSrc(path: string): string {
  return path.startsWith("http") ? path : storageUrl(`event-images/${path}`, { width: 900, quality: 75 });
}

export default async function BlogIndexPage() {
  const posts = await getPosts();
  const [lead, ...rest] = posts;

  // Blog JSON-LD. Naming every post here gives crawlers the full list from one
  // page, which matters most for the newest one.
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "The Green House Blog",
    "url": `${SITE_URL}/blog`,
    "description": "Reflections, session recaps, and notes from a cross-church worship community in Nairobi, Kenya.",
    "publisher": {
      "@type": "Organization",
      "name": "The Green House Worship Community",
      "url": SITE_URL,
    },
    "blogPost": posts.slice(0, 20).map(p => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "url": `${SITE_URL}/blog/${p.slug}`,
      "datePublished": p.published_at,
      "author": { "@type": "Organization", "name": p.author_name },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      {/* Hero */}
      <section className="relative bg-forest overflow-hidden pt-28 pb-16 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,rgba(201,162,74,0.10),transparent)]" />
        <div className="absolute top-24 right-24 w-52 h-52 rounded-full border border-cream/5 hidden lg:block" />
        <div className="absolute -bottom-10 left-10 w-32 h-32 rounded-full border border-gold/10 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <span className="label-caps text-gold/80">Writing</span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream mt-2 leading-[0.95]">
              Between the
              <br />
              <em className="not-italic text-gold">sessions.</em>
            </h1>
            <p className="text-cream/60 mt-6 max-w-xl leading-relaxed">
              Reflections, recaps, and the thinking behind what we do. Written for anyone
              who gathers with us, and anyone still deciding whether to.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Posts */}
      <section className="bg-off-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {posts.length === 0 ? (
            <FadeIn>
              <div className="flex flex-col items-center text-center py-20">
                <PenLine size={26} className="text-charcoal/15 mb-4" />
                <p className="font-display text-2xl text-charcoal/70">The first post is on its way</p>
                <p className="text-sm text-charcoal/40 mt-2 max-w-sm">
                  Nothing published yet. In the meantime, the sessions page has everything
                  about the next gathering.
                </p>
                <Link
                  href="/events"
                  className="mt-6 inline-flex items-center gap-2 bg-forest text-cream text-sm font-medium px-5 py-3 rounded hover:bg-moss transition-colors"
                >
                  See the sessions
                  <ArrowRight size={15} />
                </Link>
              </div>
            </FadeIn>
          ) : (
            <>
              {/* Lead post */}
              <FadeIn>
                <Link href={`/blog/${lead.slug}`} className="group block">
                  <article className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden bg-forest/5 order-1 lg:order-2">
                      {lead.cover_image ? (
                        <Image
                          src={coverSrc(lead.cover_image)}
                          alt={lead.cover_alt ?? ""}
                          fill
                          priority
                          sizes="(max-width: 1024px) 92vw, 46vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-forest-gradient" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-forest/30 to-transparent" />
                    </div>

                    <div className="order-2 lg:order-1">
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-charcoal/40">
                        <span className="text-gold">{categoryLabel(lead.category)}</span>
                        <span aria-hidden>·</span>
                        <span>{formatPostDate(lead.published_at)}</span>
                      </div>
                      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal mt-3 leading-[1.05] text-balance group-hover:text-forest transition-colors">
                        {lead.title}
                      </h2>
                      {lead.excerpt && (
                        <p className="text-charcoal/55 mt-4 leading-relaxed max-w-lg">{lead.excerpt}</p>
                      )}
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-forest mt-6">
                        Read this
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </article>
                </Link>
              </FadeIn>

              {rest.length > 0 && (
                <>
                  <div className="h-px bg-mist my-14 sm:my-16" />
                  <FadeInStagger>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {rest.map(p => (
                        <StaggerChild key={p.id}>
                          <Link href={`/blog/${p.slug}`} className="group flex flex-col h-full">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-forest/5">
                              {p.cover_image ? (
                                <Image
                                  src={coverSrc(p.cover_image)}
                                  alt={p.cover_alt ?? ""}
                                  fill
                                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                  unoptimized
                                />
                              ) : (
                                <div className="absolute inset-0 bg-forest-gradient" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-charcoal/40 mt-4">
                              <span className="text-gold">{categoryLabel(p.category)}</span>
                              <span aria-hidden>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={10} />{p.reading_minutes} min
                              </span>
                            </div>
                            <h3 className="font-display text-xl font-semibold text-charcoal mt-2 leading-snug text-balance group-hover:text-forest transition-colors">
                              {p.title}
                            </h3>
                            {p.excerpt && (
                              <p className="text-sm text-charcoal/50 mt-2 leading-relaxed line-clamp-3">
                                {p.excerpt}
                              </p>
                            )}
                            <span className="text-[11px] text-charcoal/35 mt-auto pt-4">
                              {formatPostDate(p.published_at)}
                            </span>
                          </Link>
                        </StaggerChild>
                      ))}
                    </div>
                  </FadeInStagger>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
