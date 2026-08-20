"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, ExternalLink, Pencil, Trash2, Clock } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { categoryLabel, formatPostDate } from "@/lib/blog";
import { cn } from "@/lib/utils";

type PostRow = {
  id:              string;
  slug:            string;
  title:           string;
  excerpt:         string | null;
  category:        string;
  status:          string;
  author_name:     string;
  reading_minutes: number;
  view_count:      number;
  published_at:    string | null;
  created_at:      string;
  updated_at:      string;
};

type FilterKey = "all" | "published" | "draft";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "published", label: "Published" },
  { key: "draft",     label: "Drafts" },
];

export function BlogTable({ posts }: { posts: PostRow[] }) {
  const router  = useRouter();
  const confirm = useConfirm();
  const [filter, setFilter]   = useState<FilterKey>("all");
  const [query, setQuery]     = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId]   = useState<string | null>(null);

  const counts = useMemo(() => ({
    all:       posts.length,
    published: posts.filter(p => p.status === "published").length,
    draft:     posts.filter(p => p.status === "draft").length,
  }), [posts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [posts, filter, query]);

  async function handleDelete(post: PostRow) {
    const ok = await confirm({
      title:        "Delete this post?",
      message:      `"${post.title}" will be removed from the site. You can restore it from System Trash.`,
      confirmLabel: "Delete",
      destructive:  true,
    });
    if (!ok) return;

    setBusyId(post.id);
    const res = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Could not delete the post. Please try again.");
      return;
    }
    toast.success("Post deleted");
    startTransition(() => router.refresh());
  }

  async function togglePublish(post: PostRow) {
    const next = post.status === "published" ? "draft" : "published";
    setBusyId(post.id);
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next }),
    });
    setBusyId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Could not update the post. Please try again.");
      return;
    }
    toast.success(next === "published" ? "Post published" : "Moved back to draft");
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col min-h-0">

      {/* Filters + search */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3 border-b border-mist">
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded transition-colors",
                filter === f.key
                  ? "bg-forest text-cream"
                  : "text-charcoal/50 hover:text-charcoal hover:bg-mist/60"
              )}
            >
              {f.label}
              <span className="ml-1.5 opacity-60 tabular-nums">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search posts"
          className="ml-auto w-full sm:w-56 text-sm bg-mist/40 border border-mist rounded px-3 py-1.5 outline-none focus:border-forest/30 focus:bg-white transition-colors"
        />
      </div>

      {visible.length === 0 ? (
        <div className="py-14 text-center text-sm text-charcoal/35">
          No posts match that filter
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="md:hidden max-h-[440px] overflow-y-auto divide-y divide-mist">
            {visible.map(p => (
              <div key={p.id} className="p-4 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal leading-snug">{p.title}</p>
                    <p className="text-[11px] text-charcoal/40 mt-0.5 font-mono break-all">/blog/{p.slug}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-charcoal/45">
                  <span>{categoryLabel(p.category)}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1"><Clock size={11} />{p.reading_minutes} min</span>
                  {p.published_at && (<><span aria-hidden>·</span><span>{formatPostDate(p.published_at)}</span></>)}
                </div>
                <RowActions
                  post={p}
                  busy={busyId === p.id || pending}
                  onDelete={handleDelete}
                  onToggle={togglePublish}
                />
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block max-h-[440px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-mist">
                  <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-5 py-3">Post</th>
                  <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3 hidden lg:table-cell">Category</th>
                  <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3">Status</th>
                  <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3 hidden lg:table-cell">Published</th>
                  <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {visible.map(p => (
                  <tr key={p.id} className="hover:bg-mist/25 transition-colors">
                    <td className="px-5 py-3.5 max-w-[340px]">
                      <p className="text-sm font-medium text-charcoal leading-snug truncate">{p.title}</p>
                      <p className="text-[11px] text-charcoal/35 mt-0.5 font-mono truncate">
                        /blog/{p.slug} · {p.reading_minutes} min read
                      </p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-charcoal/55">{categoryLabel(p.category)}</span>
                    </td>
                    <td className="px-4 py-3.5"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-charcoal/45 tabular-nums">
                        {p.published_at ? formatPostDate(p.published_at) : "Not yet"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <RowActions
                          post={p}
                          busy={busyId === p.id || pending}
                          onDelete={handleDelete}
                          onToggle={togglePublish}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded border whitespace-nowrap",
        published
          ? "bg-forest/8 text-forest border-forest/15"
          : "bg-gold/12 text-[#8a6a1a] border-gold/25"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", published ? "bg-forest" : "bg-gold")} />
      {published ? "Published" : "Draft"}
    </span>
  );
}

function RowActions({
  post, busy, onDelete, onToggle,
}: {
  post:     PostRow;
  busy:     boolean;
  onDelete: (p: PostRow) => void;
  onToggle: (p: PostRow) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {post.status === "published" && (
        <Link
          href={`/blog/${post.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on the site"
          className="p-1.5 rounded text-charcoal/40 hover:text-forest hover:bg-mist transition-colors"
        >
          <ExternalLink size={14} />
        </Link>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => onToggle(post)}
        title={post.status === "published" ? "Move back to draft" : "Publish"}
        className="p-1.5 rounded text-charcoal/40 hover:text-forest hover:bg-mist transition-colors disabled:opacity-40"
      >
        <Eye size={14} />
      </button>
      <Link
        href={`/admin/blog/${post.id}`}
        title="Edit"
        className="p-1.5 rounded text-charcoal/40 hover:text-forest hover:bg-mist transition-colors"
      >
        <Pencil size={14} />
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={() => onDelete(post)}
        title="Delete"
        className="p-1.5 rounded text-charcoal/40 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
