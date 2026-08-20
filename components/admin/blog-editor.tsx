"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Eye, ImageIcon, Link2, Loader2, Pencil, Save, Search,
  Send, Sparkles, Upload, Wand2, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BLOG_CATEGORIES, slugify, readingMinutes, deriveExcerpt } from "@/lib/blog";
import { SITE_URL, storageUrl } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface BlogEditorValues {
  id?:              string;
  title:            string;
  slug:             string;
  excerpt:          string;
  content:          string;
  cover_image:      string;
  cover_alt:        string;
  author_name:      string;
  category:         string;
  tags:             string[];
  status:           "draft" | "published";
  meta_title:       string;
  meta_description: string;
}

const EMPTY: BlogEditorValues = {
  title: "", slug: "", excerpt: "", content: "", cover_image: "", cover_alt: "",
  author_name: "The Green House", category: "reflection", tags: [],
  status: "draft", meta_title: "", meta_description: "",
};

type Mode = "edit" | "preview";
type AiTask = "compose" | "draft" | "expand" | "rewrite" | "seo" | "excerpt" | "alt" | "titles" | "keywords";
type AiMode = "brief" | "notes";

export function BlogEditor({ initial, aiEnabled }: { initial?: Partial<BlogEditorValues>; aiEnabled: boolean }) {
  const router = useRouter();
  const [v, setV]           = useState<BlogEditorValues>({ ...EMPTY, ...initial });
  const [mode, setMode]     = useState<Mode>("edit");
  const [saving, setSaving] = useState<null | "draft" | "published">(null);
  const [uploading, setUploading] = useState(false);
  const [tagDraft, setTagDraft]   = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  // Preview
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, setPreviewing]   = useState(false);

  // AI
  const [aiOpen, setAiOpen]     = useState(false);
  const [aiMode, setAiMode]     = useState<AiMode>("brief");
  const [aiBrief, setAiBrief]   = useState("");
  const [aiNotes, setAiNotes]   = useState("");
  const [aiTone, setAiTone]     = useState<"warm" | "reflective" | "practical">("warm");
  const [aiBusy, setAiBusy]     = useState<AiTask | null>(null);
  const [titleIdeas, setTitleIdeas] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  // Cover image source
  const [coverMode, setCoverMode] = useState<"upload" | "link">(
    initial?.cover_image?.startsWith("http") ? "link" : "upload"
  );
  const [linkDraft, setLinkDraft] = useState(
    initial?.cover_image?.startsWith("http") ? initial.cover_image : ""
  );

  const isEdit = Boolean(v.id);
  const contentRef = useRef(v.content);
  contentRef.current = v.content;

  useEffect(() => {
    if (slugTouched) return;
    setV(prev => ({ ...prev, slug: slugify(prev.title) }));
  }, [v.title, slugTouched]);

  const minutes = useMemo(() => (v.content ? readingMinutes(v.content) : 0), [v.content]);
  const searchTitle = (v.meta_title || v.title || "Untitled post").trim();
  const searchDesc  = (v.meta_description || v.excerpt || deriveExcerpt(v.content || "", 160)).trim();

  function set<K extends keyof BlogEditorValues>(key: K, value: BlogEditorValues[K]) {
    setV(prev => ({ ...prev, [key]: value }));
  }

  /* ── preview ── */
  const loadPreview = useCallback(async () => {
    setPreviewing(true);
    const res = await fetch("/api/admin/blog/preview", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content: contentRef.current }),
    });
    setPreviewing(false);
    if (!res.ok) { toast.error("Could not render the preview."); return; }
    const { html } = await res.json();
    setPreviewHtml(html);
  }, []);

  useEffect(() => {
    if (mode === "preview") loadPreview();
  }, [mode, loadPreview]);

  /* ── cover image ── */
  async function uploadCover(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Upload failed. Use a JPEG, PNG, or WebP under 10MB.");
      return;
    }
    const { path } = await res.json();
    set("cover_image", path);
    toast.success("Cover image uploaded");
  }

  function applyLink() {
    const url = linkDraft.trim();
    if (!url) return;
    if (!/^https:\/\//i.test(url)) {
      toast.error("Use a full https:// image address.");
      return;
    }
    set("cover_image", url);
    toast.success("Cover image linked");
  }

  const coverPreviewSrc = v.cover_image
    ? (v.cover_image.startsWith("http")
        ? v.cover_image
        : storageUrl(`event-images/${v.cover_image}`, { width: 600, quality: 70 }))
    : "";

  /* ── AI ── */
  async function runAi(task: AiTask) {
    if (!aiEnabled) {
      toast.error("AI is not configured on this deployment yet.");
      return;
    }
    setAiBusy(task);
    const res = await fetch("/api/admin/blog/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task,
        mode:     aiMode,
        brief:    aiBrief.trim() || undefined,
        notes:    aiNotes.trim() || undefined,
        title:    v.title.trim() || undefined,
        content:  v.content.trim() || undefined,
        category: v.category,
        tone:     aiTone,
        keywords: keywords.length ? keywords : undefined,
      }),
    });
    setAiBusy(null);

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Generation failed. Please try again.");
      return;
    }

    switch (task) {
      case "compose":
        setV(prev => ({
          ...prev,
          content:          body.content ?? prev.content,
          // Never overwrite something the author already typed.
          title:            prev.title.trim()   ? prev.title   : (body.title ?? ""),
          excerpt:          prev.excerpt.trim() ? prev.excerpt : (body.excerpt ?? ""),
          meta_title:       body.meta_title       || prev.meta_title,
          meta_description: body.meta_description || prev.meta_description,
          tags:             prev.tags.length ? prev.tags : (body.tags ?? []),
        }));
        setMode("edit");
        setAiOpen(false);
        toast.success("Post drafted. Read it through before publishing.");
        break;
      case "draft":
      case "expand":
        set("content", body.text);
        setMode("edit");
        toast.success(
          task === "expand"
            ? "Your notes are now a post. Check the facts before publishing."
            : "Draft written. Read it through before publishing."
        );
        break;
      case "rewrite":
        set("content", body.text);
        toast.success("Draft rewritten");
        break;
      case "excerpt":
        set("excerpt", body.text);
        toast.success("Excerpt written");
        break;
      case "alt":
        set("cover_alt", body.text);
        toast.success("Alt text written");
        break;
      case "titles":
        setTitleIdeas(body.titles ?? []);
        break;
      case "keywords":
        setKeywords(body.keywords ?? []);
        toast.success("Search phrases suggested");
        break;
      case "seo":
        setV(prev => ({
          ...prev,
          meta_title:       body.meta_title || prev.meta_title,
          meta_description: body.meta_description || prev.meta_description,
          tags:             body.tags?.length ? body.tags.slice(0, 8) : prev.tags,
        }));
        toast.success("Search copy written");
        break;
    }
  }

  /* ── tags ── */
  function addTag() {
    const t = tagDraft.trim().toLowerCase();
    if (!t || v.tags.includes(t) || v.tags.length >= 8) { setTagDraft(""); return; }
    set("tags", [...v.tags, t]);
    setTagDraft("");
  }

  /* ── save ── */
  async function save(status: "draft" | "published") {
    if (v.title.trim().length < 3) { toast.error("Give the post a title first."); return; }
    if (!v.content.trim())         { toast.error("The post has no body text yet."); return; }
    if (status === "published" && v.cover_image && !v.cover_alt.trim()) {
      toast.error("Add alt text for the cover image before publishing.");
      return;
    }

    setSaving(status);
    const payload = {
      title:            v.title.trim(),
      slug:             v.slug.trim() || undefined,
      content:          v.content,
      excerpt:          v.excerpt.trim() || null,
      cover_image:      v.cover_image.trim() || null,
      cover_alt:        v.cover_alt.trim() || null,
      author_name:      v.author_name.trim() || "The Green House",
      category:         v.category,
      tags:             v.tags,
      status,
      meta_title:       v.meta_title.trim() || null,
      meta_description: v.meta_description.trim() || null,
    };

    const res = await fetch(isEdit ? `/api/admin/blog/${v.id}` : "/api/admin/blog", {
      method:  isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    setSaving(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Could not save the post. Please try again.");
      return;
    }

    toast.success(status === "published" ? "Post is live" : "Draft saved");
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5 pb-10">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded text-charcoal/45 hover:text-charcoal hover:bg-mist transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-charcoal leading-none truncate">
            {isEdit ? "Edit post" : "New post"}
          </h1>
          <p className="text-xs text-charcoal/40 mt-1">
            {minutes > 0 ? `${minutes} min read` : "Markdown supported"}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Edit / Preview */}
          <div className="flex items-center bg-mist/60 rounded p-0.5" role="tablist" aria-label="Editor mode">
            {(["edit", "preview"] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-colors capitalize",
                  mode === m ? "bg-white text-charcoal shadow-sm" : "text-charcoal/50 hover:text-charcoal"
                )}
              >
                {m === "edit" ? <Pencil size={12} /> : <Eye size={12} />}
                {m}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAiOpen(o => !o)}
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded border transition-colors",
              aiOpen
                ? "bg-gold/15 border-gold/40 text-[#8a6a1a]"
                : "border-mist text-charcoal/70 hover:bg-mist"
            )}
          >
            <Sparkles size={15} />
            AI
          </button>

          <button
            type="button"
            disabled={saving !== null}
            onClick={() => save("draft")}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded border border-mist text-charcoal/70 hover:bg-mist transition-colors disabled:opacity-50"
          >
            {saving === "draft" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save draft
          </button>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => save("published")}
            className="inline-flex items-center gap-2 bg-forest text-cream text-sm font-medium px-4 py-2.5 rounded hover:bg-moss transition-colors disabled:opacity-50"
          >
            {saving === "published" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {v.status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* AI panel */}
      {aiOpen && (
        <div className="bg-gold/6 border border-gold/25 rounded-2xl p-5">
          {!aiEnabled ? (
            <p className="text-sm text-charcoal/60">
              AI is not configured on this deployment. Add <code className="font-mono text-xs bg-white/70 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> to the environment and redeploy to turn it on.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-[#8a6a1a]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a6a1a]">Write with AI</span>
              </div>

              {/* Two ways in: describe what it should cover, or hand over
                  your own notes and let the model shape them. */}
              <div className="flex items-center bg-white/60 rounded p-0.5 mb-3 max-w-md" role="tablist" aria-label="Generation mode">
                {([
                  { key: "brief" as AiMode, label: "Expand my idea",   hint: "A sentence is enough" },
                  { key: "notes" as AiMode, label: "Keep to my notes", hint: "Nothing invented" },
                ]).map(m => (
                  <button
                    key={m.key}
                    type="button"
                    role="tab"
                    aria-selected={aiMode === m.key}
                    onClick={() => setAiMode(m.key)}
                    className={cn(
                      "flex-1 text-left px-3 py-2 rounded transition-colors",
                      aiMode === m.key ? "bg-white shadow-sm" : "hover:bg-white/60"
                    )}
                  >
                    <span className={cn("block text-[11px] font-medium", aiMode === m.key ? "text-charcoal" : "text-charcoal/55")}>
                      {m.label}
                    </span>
                    <span className="block text-[10px] text-charcoal/35">{m.hint}</span>
                  </button>
                ))}
              </div>

              {aiMode === "brief" ? (
                <textarea
                  value={aiBrief}
                  onChange={e => setAiBrief(e.target.value)}
                  rows={4}
                  placeholder="What is the post about? A sentence or two is enough. For example: who we are as a worship community, and why we gather quarterly rather than every week."
                  className="w-full text-sm bg-white border border-gold/25 rounded p-3 outline-none focus:border-gold/60 transition-colors resize-y placeholder:text-charcoal/30"
                />
              ) : (
                <>
                  <textarea
                    value={aiNotes}
                    onChange={e => setAiNotes(e.target.value)}
                    rows={8}
                    placeholder={"Paste your own notes, a rough outline, or the idea in your own words. Bullet points are fine.\n\nThe model keeps your facts, your order and your point of view. It will not invent names, dates, songs or scripture, and it marks anything unclear as [check this] rather than filling it in."}
                    className="w-full text-sm bg-white border border-gold/25 rounded p-3 outline-none focus:border-gold/60 transition-colors resize-y placeholder:text-charcoal/30"
                  />
                  <p className="text-[11px] text-charcoal/45 mt-1.5">
                    Use this for session recaps and anything where the details matter.
                  </p>
                </>
              )}

              {/* Search phrases the post should target */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/40">
                    Search phrases to target
                  </span>
                  <button
                    type="button"
                    disabled={aiBusy !== null}
                    onClick={() => runAi("keywords")}
                    className="inline-flex items-center gap-1 text-[10px] text-[#8a6a1a] hover:underline disabled:opacity-40"
                  >
                    {aiBusy === "keywords" ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                    Suggest phrases
                  </button>
                </div>
                {keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map(k => (
                      <span key={k} className="inline-flex items-center gap-1 text-[11px] bg-white/80 border border-gold/25 rounded px-2 py-1">
                        {k}
                        <button
                          type="button"
                          onClick={() => setKeywords(keywords.filter(x => x !== k))}
                          className="text-charcoal/35 hover:text-red-600"
                          aria-label={`Remove ${k}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-charcoal/35">
                    None set. Anything here gets woven into the draft and the search copy.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <div className="flex items-center gap-1 mr-1">
                  {(["warm", "reflective", "practical"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTone(t)}
                      className={cn(
                        "text-[11px] px-2.5 py-1.5 rounded capitalize transition-colors",
                        aiTone === t ? "bg-forest text-cream" : "bg-white/70 text-charcoal/55 hover:bg-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={aiBusy !== null}
                  onClick={() => runAi("compose")}
                  className="inline-flex items-center gap-2 bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded hover:bg-moss transition-colors disabled:opacity-50"
                >
                  {aiBusy === "compose"
                    ? <><Loader2 size={14} className="animate-spin" /> Writing the post</>
                    : <><Wand2 size={14} /> Write the post</>}
                </button>

                {v.content.trim() && (
                  <span className="text-[11px] text-charcoal/40">
                    This replaces the body below.
                  </span>
                )}
              </div>

              {/* Refinements, useful once there is a draft to work on. */}
              {v.content.trim() && (
                <details className="mt-3 group">
                  <summary className="text-[11px] text-charcoal/50 cursor-pointer select-none hover:text-charcoal/80">
                    Refine what is there
                  </summary>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <AiButton task="rewrite" busy={aiBusy} onRun={runAi}>Improve the writing</AiButton>
                    <AiButton task="titles"  busy={aiBusy} onRun={runAi}>Other titles</AiButton>
                    <AiButton task="excerpt" busy={aiBusy} onRun={runAi}>Rewrite the excerpt</AiButton>
                    <AiButton task="seo"     busy={aiBusy} onRun={runAi}>Redo the search copy</AiButton>
                  </div>
                </details>
              )}

              {titleIdeas.length > 0 && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/35">Title ideas</span>
                  {titleIdeas.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { set("title", t); setTitleIdeas([]); toast.success("Title applied"); }}
                      className="text-left text-sm text-charcoal/75 bg-white/70 hover:bg-white rounded px-3 py-2 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-charcoal/45 mt-4">
                One press fills the title, body, excerpt, tags and search copy. Everything lands in the
                editor as a draft: read it before publishing, because it does not know your venue,
                your dates, or who was in the room.
              </p>
            </>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">

        {/* ── Main column ── */}
        <div className="flex flex-col gap-5 min-w-0">

          <Card>
            <Field label="Title">
              <input
                value={v.title}
                onChange={e => set("title", e.target.value)}
                placeholder="What is this post about?"
                className="w-full text-lg font-medium bg-transparent outline-none placeholder:text-charcoal/25"
              />
            </Field>

            <Field label="URL" hint={`${SITE_URL}/blog/`}>
              <input
                value={v.slug}
                onChange={e => { setSlugTouched(true); set("slug", slugify(e.target.value)); }}
                placeholder="auto-generated-from-title"
                className="w-full text-sm font-mono bg-transparent outline-none placeholder:text-charcoal/25"
              />
            </Field>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <Label>{mode === "edit" ? "Body" : "Preview"}</Label>
              {mode === "preview" && previewing && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-charcoal/40">
                  <Loader2 size={11} className="animate-spin" />
                  Rendering
                </span>
              )}
            </div>

            {mode === "edit" ? (
              <>
                <textarea
                  value={v.content}
                  onChange={e => set("content", e.target.value)}
                  rows={22}
                  placeholder={"Write in Markdown.\n\n## Headings become links in the contents list\n\n**bold**, *italic*, > quotes, - lists"}
                  className="w-full text-sm leading-relaxed font-mono bg-mist/25 border border-mist rounded p-4 outline-none focus:border-forest/30 focus:bg-white transition-colors resize-y placeholder:text-charcoal/25"
                />
                <p className="text-[11px] text-charcoal/35 mt-2">
                  Markdown. Headings written as <code className="font-mono">##</code> get their own link on the page.
                </p>
              </>
            ) : (
              <div className="border border-mist rounded p-6 bg-off-white min-h-[400px]">
                {previewHtml ? (
                  <article className="article-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <p className="text-sm text-charcoal/35">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </Card>

          {/* Search preview */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Search size={13} className="text-charcoal/35" />
              <Label>How this looks on Google</Label>
            </div>
            <div className="bg-mist/30 rounded p-4 border border-mist">
              <p className="text-[11px] text-charcoal/45 truncate">
                {SITE_URL.replace(/^https?:\/\//, "")} › blog › {v.slug || "post-url"}
              </p>
              <p className="text-[17px] text-[#1a5fb4] leading-snug mt-1 truncate">
                {searchTitle.length > 60 ? `${searchTitle.slice(0, 60)}...` : searchTitle}
              </p>
              <p className="text-[13px] text-charcoal/60 leading-snug mt-1 line-clamp-2">
                {searchDesc || "Add an excerpt so search results show a proper summary."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <Counter label="Search title" value={searchTitle.length} max={60} />
              <Counter label="Search description" value={searchDesc.length} max={155} />
            </div>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-5 min-w-0">

          <Card>
            <Field label="Category">
              <select
                value={v.category}
                onChange={e => set("category", e.target.value)}
                className="w-full text-sm bg-transparent outline-none"
              >
                {BLOG_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Author">
              <input
                value={v.author_name}
                onChange={e => set("author_name", e.target.value)}
                className="w-full text-sm bg-transparent outline-none"
              />
            </Field>
          </Card>

          {/* Cover image */}
          <Card>
            <Label>Cover image</Label>

            {v.cover_image ? (
              <div className="mt-2 flex flex-col gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreviewSrc}
                  alt=""
                  className="w-full aspect-[16/10] object-cover rounded border border-mist bg-mist/40"
                />
                <div className="flex items-center gap-2 bg-mist/40 rounded p-2 border border-mist">
                  {v.cover_image.startsWith("http")
                    ? <Link2 size={13} className="text-charcoal/40 flex-shrink-0" />
                    : <ImageIcon size={13} className="text-charcoal/40 flex-shrink-0" />}
                  <span className="text-[11px] font-mono text-charcoal/55 truncate flex-1">{v.cover_image}</span>
                  <button
                    type="button"
                    onClick={() => { set("cover_image", ""); set("cover_alt", ""); setLinkDraft(""); }}
                    className="p-1 rounded text-charcoal/40 hover:text-red-600 transition-colors"
                    aria-label="Remove cover image"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Alt text</Label>
                    {aiEnabled && (
                      <button
                        type="button"
                        disabled={aiBusy !== null}
                        onClick={() => runAi("alt")}
                        className="inline-flex items-center gap-1 text-[10px] text-[#8a6a1a] hover:underline disabled:opacity-40"
                      >
                        {aiBusy === "alt" ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                        Suggest
                      </button>
                    )}
                  </div>
                  <input
                    value={v.cover_alt}
                    onChange={e => set("cover_alt", e.target.value)}
                    placeholder="What a sighted reader would see"
                    className="w-full text-xs bg-mist/25 border border-mist rounded px-3 py-2 outline-none focus:border-forest/30 focus:bg-white transition-colors"
                  />
                  <p className="text-[10px] text-charcoal/35 mt-1.5">
                    Required before publishing. Screen readers and search engines both use it.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center bg-mist/60 rounded p-0.5 mb-2.5">
                  {(["upload", "link"] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCoverMode(m)}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded transition-colors capitalize",
                        coverMode === m ? "bg-white text-charcoal shadow-sm" : "text-charcoal/50 hover:text-charcoal"
                      )}
                    >
                      {m === "upload" ? <Upload size={11} /> : <Link2 size={11} />}
                      {m}
                    </button>
                  ))}
                </div>

                {coverMode === "upload" ? (
                  <label className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-mist rounded py-7 cursor-pointer hover:border-forest/30 hover:bg-mist/20 transition-colors">
                    {uploading
                      ? <Loader2 size={16} className="animate-spin text-charcoal/40" />
                      : <ImageIcon size={16} className="text-charcoal/30" />}
                    <span className="text-[11px] text-charcoal/45">
                      {uploading ? "Uploading" : "JPEG, PNG, or WebP"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
                    />
                  </label>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      value={linkDraft}
                      onChange={e => setLinkDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full text-xs font-mono bg-mist/25 border border-mist rounded px-3 py-2 outline-none focus:border-forest/30 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={applyLink}
                      className="text-xs font-medium bg-forest text-cream px-3 py-2 rounded hover:bg-moss transition-colors"
                    >
                      Use this image
                    </button>
                    <p className="text-[10px] text-charcoal/35">
                      The image stays on whichever host you link to. If that host goes away, so does the image.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <Label>Excerpt</Label>
              {aiEnabled && (
                <button
                  type="button"
                  disabled={aiBusy !== null}
                  onClick={() => runAi("excerpt")}
                  className="inline-flex items-center gap-1 text-[10px] text-[#8a6a1a] hover:underline disabled:opacity-40"
                >
                  {aiBusy === "excerpt" ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                  Write it
                </button>
              )}
            </div>
            <p className="text-[10px] text-charcoal/35 mt-1 mb-2">
              Shown on the blog index and in search results.
            </p>
            <textarea
              value={v.excerpt}
              onChange={e => set("excerpt", e.target.value)}
              rows={3}
              placeholder="Leave blank to use the opening lines of the post."
              className="w-full text-sm bg-mist/25 border border-mist rounded px-3 py-2 outline-none focus:border-forest/30 focus:bg-white transition-colors resize-y placeholder:text-charcoal/25"
            />
          </Card>

          <Card>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {v.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] bg-mist/60 border border-mist rounded px-2 py-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => set("tags", v.tags.filter(x => x !== t))}
                    className="text-charcoal/35 hover:text-red-600"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagDraft}
              onChange={e => setTagDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder={v.tags.length >= 8 ? "Tag limit reached" : "Type a tag, press Enter"}
              disabled={v.tags.length >= 8}
              className="w-full mt-2 text-xs bg-mist/25 border border-mist rounded px-3 py-2 outline-none focus:border-forest/30 focus:bg-white transition-colors disabled:opacity-50"
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <Label>Search overrides</Label>
              {aiEnabled && (
                <button
                  type="button"
                  disabled={aiBusy !== null}
                  onClick={() => runAi("seo")}
                  className="inline-flex items-center gap-1 text-[10px] text-[#8a6a1a] hover:underline disabled:opacity-40"
                >
                  {aiBusy === "seo" ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                  Write them
                </button>
              )}
            </div>
            <p className="text-[10px] text-charcoal/35 mt-1 mb-3">
              Only fill these in when the search copy should differ from the post copy.
            </p>
            <Field label="Meta title">
              <input
                value={v.meta_title}
                onChange={e => set("meta_title", e.target.value)}
                maxLength={70}
                placeholder="Defaults to the post title"
                className="w-full text-sm bg-transparent outline-none placeholder:text-charcoal/25"
              />
            </Field>
            <Field label="Meta description">
              <textarea
                value={v.meta_description}
                onChange={e => set("meta_description", e.target.value)}
                maxLength={170}
                rows={3}
                placeholder="Defaults to the excerpt"
                className="w-full text-sm bg-transparent outline-none resize-y placeholder:text-charcoal/25"
              />
            </Field>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── small building blocks ── */

function AiButton({
  task, busy, onRun, icon: Icon, primary, children,
}: {
  task:     AiTask;
  busy:     AiTask | null;
  onRun:    (t: AiTask) => void;
  icon?:    LucideIcon;
  /** The action that writes the post. Everything else refines what is there. */
  primary?: boolean;
  children: React.ReactNode;
}) {
  const isBusy = busy === task;
  return (
    <button
      type="button"
      disabled={busy !== null}
      onClick={() => onRun(task)}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded border transition-colors disabled:opacity-40",
        primary
          ? "bg-forest text-cream border-forest hover:bg-moss"
          : "bg-white/80 hover:bg-white text-charcoal/70 border-gold/20"
      )}
    >
      {isBusy ? <Loader2 size={11} className="animate-spin" /> : Icon ? <Icon size={11} /> : null}
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-mist p-5">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/35">
      {children}
    </span>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0 border-b border-mist/70 last:border-0">
      <div className="flex items-baseline gap-2 mb-1">
        <Label>{label}</Label>
        {hint && <span className="text-[10px] text-charcoal/25 font-mono truncate">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Counter({ label, value, max }: { label: string; value: number; max: number }) {
  const over = value > max;
  const empty = value === 0;
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-charcoal/40">{label}</span>
      <span className={cn(
        "tabular-nums font-medium",
        over ? "text-red-600" : empty ? "text-charcoal/30" : "text-forest"
      )}>
        {value} / {max}
      </span>
    </div>
  );
}
