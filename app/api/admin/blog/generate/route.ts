import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { generateText, unfence, isAiConfigured, AiUnavailableError } from "@/lib/ai";
import { SITE_NAME, SESSION_FREQUENCY } from "@/lib/constants";
import { deriveExcerpt } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  task:     z.enum(["draft", "expand", "rewrite", "seo", "excerpt", "alt", "titles", "keywords"]),
  mode:     z.enum(["brief", "notes"]).optional(),
  brief:    z.string().trim().max(4000).optional(),
  notes:    z.string().trim().max(12_000).optional(),
  title:    z.string().trim().max(200).optional(),
  content:  z.string().trim().max(30_000).optional(),
  category: z.string().trim().max(40).optional(),
  tone:     z.enum(["warm", "reflective", "practical"]).optional(),
  keywords: z.array(z.string().trim().max(60)).max(10).optional(),
});

// The voice and the search rules in one place. The model has no other way to
// know either, and a wrong-voice draft costs more time to fix than it saves.
const HOUSE_STYLE = `You are writing for ${SITE_NAME}, a cross-church worship community in Nairobi, Kenya. Their website is greenhousews.co.ke.

VOICE
- Warm, plain, unhurried. Write the way one person talks to another.
- No hype, no marketing language, no exclamation marks.
- Kenyan English spelling. Assume a Nairobi reader who may or may not be churched.
- Short paragraphs. Most people read this on a phone.

SEARCH
This blog exists so the site ranks for people in Nairobi looking for a worship
community. Every post has to earn its place in search results, so:
- Work the natural search phrases into the writing: worship community Nairobi,
  cross-church worship Kenya, worship night Nairobi, Christian community
  Nairobi, prayer and worship Nairobi, and the post's own subject.
- Put the main phrase in the opening paragraph and in at least one "##"
  heading, phrased the way a person would actually type it into Google.
- Write headings as questions or concrete statements, not one-word labels.
  "Why burnout is common in ministry" earns a search result. "Burnout" does not.
- Repeat the community name and the city naturally through the piece, roughly
  once every few paragraphs. Never stuff. A keyword phrase must sit inside a
  sentence that would still read well without it: if it needs the grammar bent
  around it, drop the keyword and write the sentence properly. "a cross-church
  worship Kenya community" is bent. "a cross-church community here in Kenya" is
  not. Getting this wrong reads as spam to a person and to Google.
- Aim for 600 to 900 words. Thin posts do not rank.
- Link to the sessions page and the about page when the subject calls for it.
  Markdown link syntax is [visible text](/path), so write [our sessions](/events)
  and [about us](/about). The path goes in the brackets on the right, never the
  text on the left.

HARD RULES
- Gatherings are ${SESSION_FREQUENCY}. Never write "monthly", "weekly", or any other frequency.
- Never use em dashes. Use a comma, a colon, or a full stop instead.
- Never promise anything the site does not do: no WhatsApp ticket delivery, no livestream, no paid membership.
- Do not invent dates, venues, names, scripture references, songs or attendance numbers. If a specific detail is needed and was not supplied, write a clearly marked gap like [venue name] rather than guessing.
- Do not claim the community has done something unless you were told it did.`;

function keywordLine(keywords?: string[]): string {
  if (!keywords?.length) return "";
  return `\nPrioritise these search phrases, used naturally: ${keywords.join(", ")}.`;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured. Add GEMINI_API_KEY to the environment to enable it." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const { task, brief, notes, title, content, category, tone, keywords } = parsed.data;

  let prompt: string;
  let maxTokens = 3072;
  let temperature = 0.7;

  switch (task) {
    /* Write from a short brief: the author says what it should cover and the
       model supplies the substance. */
    case "draft":
      if (!brief) return NextResponse.json({ error: "Describe what the post should cover first." }, { status: 400 });
      prompt = `Write a blog post in Markdown.

Brief: ${brief}
${title ? `Working title: ${title}` : ""}
${category ? `Category: ${category}` : ""}
${tone ? `Tone: ${tone}` : ""}${keywordLine(keywords)}

Structure it with three or four "##" headings.
Open with a concrete observation, not a definition.
Close with something the reader can act on or sit with.
Return only the Markdown body. Do not include the title as a heading, and do not wrap the output in a code fence.`;
      break;

    /* Write from the author's own notes: their thinking, their facts, their
       order. The model shapes rather than invents. This is the mode to use for
       a session recap, where the details matter and must not be improvised. */
    case "expand":
      if (!notes) return NextResponse.json({ error: "Paste your notes or a rough outline first." }, { status: 400 });
      prompt = `Turn the notes below into a finished blog post in Markdown.

These are the author's own notes. Your job is to shape them, not to replace them:
- Keep every fact, name, number, song title and scripture reference exactly as written. Do not add any that are not there.
- Keep the author's order of ideas and their point of view.
- Where a note is a fragment, expand it into full sentences that say what the note says and nothing more.
- Add "##" headings that name the ideas already present.
- If the notes leave something unclear, write a clearly marked gap like [check this] rather than filling it in yourself.

${title ? `Working title: ${title}` : ""}
${category ? `Category: ${category}` : ""}
${tone ? `Tone: ${tone}` : ""}${keywordLine(keywords)}

NOTES:
${notes}

Return only the Markdown body. Do not wrap the output in a code fence.`;
      temperature = 0.45;
      break;

    case "rewrite":
      if (!content) return NextResponse.json({ error: "There is no draft to rewrite yet." }, { status: 400 });
      prompt = `Rewrite the following blog post so it reads better and ranks better.

Keep every fact, name, number, song title and scripture reference exactly as written.
Tighten the prose, break up long paragraphs, and rewrite the headings so they read
like something a person would search for.${keywordLine(keywords)}
Keep it in Markdown and return only the body.

${content}`;
      temperature = 0.4;
      break;

    case "seo":
      if (!content && !title) return NextResponse.json({ error: "Write the post first, then generate its search copy." }, { status: 400 });
      prompt = `Write search engine metadata for this blog post.

Title: ${title ?? "(untitled)"}
Body: ${(content ?? "").slice(0, 5000)}

Return JSON only, with exactly these keys:
{"meta_title": "...", "meta_description": "...", "tags": ["...", "..."]}

Rules:
- meta_title: at most 60 characters. Lead with the phrase a Nairobi reader would type into Google. Include the subject, and the city or the community name where it fits naturally.
- meta_description: between 140 and 155 characters. A real summary that answers what the reader will get, carrying the main search phrase in the first half.
- tags: 4 to 6 lowercase tags mixing the post's subject with location terms people search, such as "worship nairobi" or "christian community kenya". No hashes.
- Do not wrap the JSON in a code fence.`;
      maxTokens = 700;
      temperature = 0.3;
      break;

    case "keywords":
      prompt = `List the search phrases this blog post should target.

Subject: ${brief || title || (content ?? "").slice(0, 2000)}

Return one phrase per line, no numbering, no commentary. Between 5 and 8 phrases.
Mix the specific subject with the location, the way someone in Nairobi would
actually search. Favour phrases with real intent behind them over broad single
words.`;
      maxTokens = 300;
      temperature = 0.5;
      break;

    case "excerpt":
      if (!content) return NextResponse.json({ error: "There is no draft to summarise yet." }, { status: 400 });
      prompt = `Write a single-paragraph excerpt for this blog post. Between 25 and 45 words. It appears on the blog index and in search results, so make it a summary rather than a hook, and carry the main search phrase naturally. Return the sentence only.

${content.slice(0, 5000)}`;
      maxTokens = 250;
      temperature = 0.4;
      break;

    case "titles":
      prompt = `Suggest 5 titles for this blog post.

Each under 60 characters, concrete, no clickbait, no colon-plus-subtitle formula.
Write them the way a person would search for the subject, and include the city
or the community name in at least two of them.
Return one per line with no numbering.

${notes ?? brief ?? content?.slice(0, 3000) ?? title ?? ""}`;
      maxTokens = 350;
      temperature = 0.9;
      break;

    case "alt":
      prompt = `Write alt text for the cover image of a blog post titled "${title ?? "untitled"}"${brief ? ` showing: ${brief}` : ""}. One sentence, under 125 characters, describing what a sighted reader would see. Do not start with "Image of" or "Photo of". Return the sentence only.`;
      maxTokens = 150;
      temperature = 0.5;
      break;
  }

  try {
    const raw = unfence(await generateText({ system: HOUSE_STYLE, prompt, maxTokens, temperature }));

    if (task === "seo") {
      try {
        const json = JSON.parse(raw) as { meta_title?: string; meta_description?: string; tags?: string[] };
        return NextResponse.json({
          meta_title:       (json.meta_title ?? "").slice(0, 70),
          meta_description: (json.meta_description ?? "").slice(0, 170),
          tags:             (json.tags ?? []).slice(0, 6).map(t => t.toLowerCase().replace(/^#/, "").trim()).filter(Boolean),
        });
      } catch {
        // The model ignored the JSON instruction. Salvage a description rather
        // than failing the whole request.
        return NextResponse.json({
          meta_title:       (title ?? "").slice(0, 70),
          meta_description: deriveExcerpt(raw, 155),
          tags:             [],
        });
      }
    }

    if (task === "titles" || task === "keywords") {
      const lines = raw
        .split("\n")
        .map(l => l.replace(/^\s*[-*\d.)]+\s*/, "").replace(/^["']|["']$/g, "").trim())
        .filter(Boolean)
        .slice(0, 8);
      return NextResponse.json(task === "titles" ? { titles: lines.slice(0, 5) } : { keywords: lines });
    }

    return NextResponse.json({ text: raw });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
