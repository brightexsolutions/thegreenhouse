"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Leaf, ArrowRight } from "lucide-react";
import { SESSION_FREQUENCY, CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Action {
  label: string;
  href:  string;
}

interface Msg {
  id:      number;
  role:    "user" | "bot";
  text:    string;
  chips?:  string[];
  action?: Action;
}

interface BotReply {
  text:        string;
  chips?:      string[];
  action?:     Action;
  isGreeting?: boolean;
}

interface UpcomingEvent {
  slug:              string;
  title:             string;
  event_date:        string;
  event_time:        string;
  venue_name:        string | null;
  venue_address?:    string | null;
  theme_title?:      string | null;
  theme_scripture?:  string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-KE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function fmtTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function hasVenue(e: UpcomingEvent | null | undefined): boolean {
  return !!e?.venue_name && e.venue_name.trim().toUpperCase() !== "TBA";
}

// ─── Intent engine ────────────────────────────────────────────────────────────

const GREET_RE = /\b(hi+|hello+|hey+|hiya|howdy|yo+|sup|greetings|good\s+(morning|afternoon|evening|day)|wassup|what'?s\s*up|peace)\b/i;

const INTENTS: Array<{ re: RegExp; reply: () => BotReply }> = [
  {
    re: /what\s*(is|'?s)?\s*(the\s*)?green\s*house|about\s*(you|green\s*house|this)|tell\s*me\s*more|who\s*are\s*you/i,
    reply: () => ({
      text:   "The Green House is a cross-church worship and sharing community in Nairobi, Kenya. We gather **quarterly** for an evening of low-pressure worship, prayer, and genuine connection — no performance, no pressure, just real community across different churches.",
      chips:  ["Who can attend?", "When is the next session?", "Is it free?"],
      action: { label: "Learn more about us", href: "/about" },
    }),
  },
  {
    re: /how\s*(do\s*i|to|can\s*i)?\s*(register|sign\s*up|book|get\s*a?\s*ticket)/i,
    reply: () => ({
      text:   "Head to our **Events** page, click on Session 02, and fill in your details. You'll receive a **PDF ticket via email** — you can also copy your ticket link to save it anywhere.",
      chips:  ["Is it free?", "What do I receive after registering?"],
      action: { label: "Register for Session 02", href: "/events/session-02" },
    }),
  },
  {
    re: /free|cost|price|pay|charge|fee/i,
    reply: () => ({
      text:   "Yes — entry is completely free. Some future sessions may include a small venue contribution, but this will always be communicated clearly in advance.",
      chips:  ["How do I register?", "Who can attend?"],
      action: { label: "Register for free", href: "/events/session-02" },
    }),
  },
  {
    re: /ticket|receive|get\s*(after|my)|confirmation/i,
    reply: () => ({
      text:   "After registering, you'll get a **PDF ticket via email**. You can also copy your ticket link to save it somewhere handy — bring it on your phone screen to the door.",
      chips:  ["Where will it be held?", "When is the next session?"],
      action: { label: "Register now", href: "/events/session-02" },
    }),
  },
  {
    re: /who\s*(can|is\s*it\s*for|attends?)|everyone|anyone|welcome|inclusive|denomination|friend|church/i,
    reply: () => ({
      text:  "Everyone is welcome — regardless of church, denomination, or where you are in your faith journey. Come curious, come sceptical, come as you are. You can even bring someone who doesn't attend church.",
      chips: ["What happens at a session?", "Is it free?"],
    }),
  },
  {
    re: /what\s*happen|what\s*to\s*expect|program|agenda|evening\s*like|session\s*like|structure/i,
    reply: () => ({
      text:  "A Green House evening includes live worship, prayer, open sharing, and genuine connection time. It's relaxed and intimate — more like a gathering of friends than a formal service.",
      chips: ["What's the theme for Session 02?", "Who can attend?"],
    }),
  },
  {
    re: /how\s*often|frequency|quarterly|monthly|times\s*a\s*(year|month)|per\s*(year|month)/i,
    reply: () => ({
      text:  `Sessions happen **${SESSION_FREQUENCY}** — four times a year. We keep it rare so each gathering feels meaningful, not routine.`,
      chips: ["When is the next session?", "What happens at a session?"],
    }),
  },
  {
    re: /christian|faith|believe|believer|sceptic|doubt|spiritual|religion/i,
    reply: () => ({
      text:  "No performance of faith is required. Come curious. Come sceptical. Come broken. The Green House is designed for the whole person, not just the spiritual surface.",
      chips: ["Who can attend?", "What happens at a session?"],
    }),
  },
  {
    re: /mental\s*health|emotional|burnout|drained|exhaust|lonely|isolat|depress|anxiety/i,
    reply: () => ({
      text:  "We believe many people quietly deal with burnout, isolation, and emotional exhaustion that traditional church settings don't always address. The Green House creates intentional space to slow down, be honest, and find rest — for the whole person.",
      chips: ["Who can attend?", "What happens at a session?"],
    }),
  },
  {
    re: /who\s*runs|organise|organiz|team|behind|leadership|founder|host/i,
    reply: () => ({
      text:  "The Green House is run by a collective of gifted people from active ministries and churches across Nairobi — worship teams, creatives, hosts, and vision-carriers who volunteer their time and gifts.",
      chips: ["What happens at a session?", "How do I stay informed?"],
    }),
  },
  {
    re: /stay\s*inform|notify|notification|news|announce|update|broadcast|mailing/i,
    reply: () => ({
      text:   "Register on the site and you'll receive updates via email before each session. You can also follow us on Instagram **@thegreenhouseke** for announcements.",
      chips:  ["Follow on Instagram", "How do I register?"],
      action: { label: "Get involved", href: "/get-involved" },
    }),
  },
  {
    re: /instagram|tiktok|youtube|social|follow|@thegreen/i,
    reply: () => ({
      text:  "Find us on Instagram and TikTok — both **@thegreenhouseke**. We post session announcements, highlights, and community moments there.",
      chips: ["How do I register?", "Contact the team"],
    }),
  },
  {
    re: /contact|reach|email|reach\s*out|talk\s*to|get\s*in\s*touch/i,
    reply: () => ({
      text:   `You can reach the team at **${CONTACT_EMAIL}**, or use the **'Get Involved'** form on our website. We'd love to hear from you!`,
      chips:  ["What is The Green House?", "How do I register?"],
      action: { label: "Get in touch", href: "/get-involved" },
    }),
  },
  {
    re: /partner|support|sponsor|volunteer|get\s*involv|contribute|serve/i,
    reply: () => ({
      text:   "We'd love to have you involved! Whether you'd like to serve, partner, or support the vision — fill in the 'Get Involved' form on the website and the team will be in touch.",
      chips:  ["Contact the team", "What is The Green House?"],
      action: { label: "Get involved", href: "/get-involved" },
    }),
  },
];

// Maps chip label → query string fed into the intent engine
const CHIP_MAP: Record<string, string> = {
  "Who can attend?":                  "who can attend",
  "When is the next session?":        "when is the next session",
  "Is it free?":                      "is it free",
  "How do I register?":               "how do I register",
  "Where will it be held?":           "where will it be held",
  "What's the theme?":                "what is the theme",
  "What's the theme for Session 02?": "what is the theme",
  "What do I receive after registering?": "ticket confirmation",
  "What happens at a session?":       "what happens at a session",
  "Who runs The Green House?":        "who runs the green house",
  "How do I stay informed?":          "how do I stay informed",
  "Follow on Instagram":              "instagram",
  "Contact the team":                 "contact",
  "What is The Green House?":         "what is the green house",
};

function getBotReply(input: string, hasGreeted: boolean, event?: UpcomingEvent | null): BotReply {
  const t = input.toLowerCase().trim();

  if (GREET_RE.test(t)) {
    if (!hasGreeted) {
      return {
        isGreeting: true,
        text:  "Hey there! 👋 Welcome to The Green House. I'm here to help you learn about our community. What would you like to know?",
        chips: ["What is The Green House?", "When is the next session?", "How do I register?", "Is it free?"],
      };
    }
    return {
      text:  "Still here! 😊 What would you like to know?",
      chips: ["What is The Green House?", "When is the next session?", "How do I register?"],
    };
  }

  // ── Dynamic: when / date ────────────────────────────────────────────────────
  if (/when|next\s*session|date|schedule|upcoming|session\s*0?2/i.test(t)) {
    if (event) {
      const date = fmtDate(event.event_date);
      const time = fmtTime(event.event_time);
      const venueLine = hasVenue(event)
        ? ` It will be held at **${event.venue_name}**.`
        : " Venue details will be shared soon — register and we'll notify you via email.";
      return {
        text:   `The next gathering is **${event.title}** on **${date}** at **${time}**.${venueLine}`,
        chips:  ["How do I register?", "Where will it be held?", "What's the theme?"],
        action: { label: `View ${event.title}`, href: `/events/${event.slug}` },
      };
    }
    return {
      text:   "The next gathering is **Session 02** on **June 26, 2026** at **7:00 PM**. Venue details will be shared soon — register and we'll notify you via email.",
      chips:  ["How do I register?", "Where will it be held?", "What's the theme?"],
      action: { label: "View Session 02", href: "/events/session-02" },
    };
  }

  // ── Dynamic: venue / location ───────────────────────────────────────────────
  if (/where|venue|location|address|place/i.test(t)) {
    if (hasVenue(event)) {
      const loc = [event!.venue_name, event?.venue_address].filter(Boolean).join(", ");
      return {
        text:   `**${event!.title}** will be held at **${loc}**. We look forward to seeing you there!`,
        chips:  ["How do I register?", "When is the next session?"],
        action: { label: "Register now", href: `/events/${event!.slug}` },
      };
    }
    return {
      text:   "The venue will be announced closer to the date. Register on our Events page and we'll send you the details via email once confirmed.",
      chips:  ["How do I register?", "When is the next session?"],
      action: { label: "Register for updates", href: event ? `/events/${event.slug}` : "/events" },
    };
  }

  // ── Dynamic: theme / scripture ──────────────────────────────────────────────
  if (/theme|topic|scripture|verse|delusion|2\s*timothy/i.test(t)) {
    if (event?.theme_title) {
      const scripture = event.theme_scripture ? `, drawn from **${event.theme_scripture}**` : "";
      return {
        text:   `The theme for this session is **'${event.theme_title}'**${scripture}. Expect worship, honest dialogue, and space to reflect.`,
        chips:  ["When is the next session?", "How do I register?"],
        action: { label: `View ${event.title}`, href: `/events/${event.slug}` },
      };
    }
    return {
      text:  "The theme for Session 02 is **'Delusion'**, drawn from **2 Timothy 4:3–6** — a conversation about truth, comfort, and what we choose to hear.",
      chips: ["When is the next session?", "How do I register?"],
    };
  }

  for (const { re, reply } of INTENTS) {
    if (re.test(t)) return reply();
  }

  return {
    text:  "I'm here to answer questions about The Green House — sessions, registration, what to expect, our community, and more. What would you like to know?",
    chips: ["What is The Green House?", "When is the next session?", "How do I register?", "Is it free?"],
  };
}

// ─── Rich text (handles **bold**) ────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p
      )}
    </>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POPUP_DELAY = 2800;
const POPUP_TTL   = 14000;
const TYPING_MS   = 520;

const WELCOME: Msg = {
  id:    0,
  role:  "bot",
  text:  "Hi! I can help answer questions about The Green House — upcoming sessions, registration, what to expect, and more.",
  chips: ["What is The Green House?", "When is the next session?", "How do I register?", "Is it free?"],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatFab({ event }: { event?: UpcomingEvent | null }) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState("");
  const [greeted, setGreeted] = useState(false);
  const [typing,  setTyping]  = useState(false);
  const [popup,   setPopup]   = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const nextId    = useRef(1);
  const pathname  = usePathname();

  // Close chat pane on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Show popup on every page load
  useEffect(() => {
    const t = setTimeout(() => setPopup(true), POPUP_DELAY);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(false), POPUP_TTL);
    return () => clearTimeout(t);
  }, [popup]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 260);
  }, [open]);

  function openChat() {
    setPopup(false);
    setOpen(true);
    if (msgs.length === 0) setMsgs([WELCOME]);
  }

  function send(text: string = input.trim()) {
    if (!text || typing) return;
    const userMsg: Msg = { id: nextId.current++, role: "user", text };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");

    const reply = getBotReply(text, greeted, event);
    if (reply.isGreeting) setGreeted(true);

    setTyping(true);
    setTimeout(() => {
      setMsgs(prev => [
        ...prev,
        { id: nextId.current++, role: "bot", text: reply.text, chips: reply.chips, action: reply.action },
      ]);
      setTyping(false);
    }, TYPING_MS);
  }

  return (
    <>
      {/* ── Chat widget ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={  { opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-[5.5rem] right-6 z-50 w-[calc(100vw-3rem)] sm:w-[360px] bg-white rounded-3xl shadow-2xl border border-mist flex flex-col origin-bottom-right overflow-hidden"
            style={{ maxHeight: "min(520px, calc(100dvh - 8rem))" }}
          >
            {/* Header */}
            <div className="bg-forest px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Leaf size={15} className="text-gold-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-none">{SITE_NAME}</p>
                <p className="text-white/45 text-[11px] mt-0.5">Community assistant</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/60 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {msgs.map(msg =>
                msg.role === "bot" ? (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Leaf size={10} className="text-forest" />
                    </div>
                    <div className="space-y-2 max-w-[85%]">
                      <div className="bg-off-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-charcoal leading-relaxed">
                        <RichText text={msg.text} />
                      </div>
                      {msg.chips && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.chips.map(chip => (
                            <button
                              key={chip}
                              onClick={() => send(CHIP_MAP[chip] ?? chip)}
                              className="text-[11px] px-2.5 py-1.5 rounded-full border border-forest/20 text-forest hover:bg-forest hover:text-cream transition-colors leading-none"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.action && (
                        <Link
                          href={msg.action.href}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-forest text-cream px-3.5 py-2 rounded-xl hover:bg-moss transition-colors mt-0.5"
                        >
                          {msg.action.label}
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-end">
                    <div className="bg-forest text-cream rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%]">
                      {msg.text}
                    </div>
                  </div>
                )
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
                      <Leaf size={10} className="text-forest" />
                    </div>
                    <div className="bg-off-white rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                      {[0, 0.18, 0.36].map(d => (
                        <motion.span
                          key={d}
                          className="block w-1.5 h-1.5 rounded-full bg-charcoal/30"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.65, repeat: Infinity, delay: d }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-mist px-4 py-3 flex gap-2 items-center flex-shrink-0 bg-white">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Ask me anything..."
                aria-label="Chat message"
                className="flex-1 text-sm bg-off-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-forest/20 text-charcoal placeholder:text-charcoal/30"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || typing}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-white disabled:opacity-35 hover:bg-moss transition-colors flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB column (popup + ripple + button) ─────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* First-visit popup bubble */}
        <AnimatePresence>
          {popup && !open && (
            <motion.div
              key="popup"
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1   }}
              exit={  { opacity: 0, y: 8, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="relative bg-white border border-mist rounded-2xl shadow-lg px-4 py-3 max-w-[210px] cursor-pointer select-none"
              onClick={openChat}
              role="button"
              aria-label="Open chat"
            >
              <p className="text-sm font-semibold text-forest leading-snug">Questions about The Green House?</p>
              <p className="text-[11px] text-charcoal/45 mt-0.5">Ask me anything ✦</p>
              {/* Down-pointing arrow toward FAB */}
              <div className="absolute -bottom-[7px] right-5 w-3.5 h-3.5 bg-white border-r border-b border-mist rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ripple rings + FAB button */}
        <div className="relative flex items-center justify-center">
          {/* Continuous ripple rings — only shown when closed */}
          {!open && [0, 0.85, 1.7].map((delay, i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                backgroundColor: "rgba(201,162,74,0.22)",
                animation: `ripple-out 2.5s ${delay}s ease-out infinite`,
              }}
            />
          ))}

          {/* FAB */}
          <motion.button
            onClick={open ? () => setOpen(false) : openChat}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            aria-label={open ? "Close chat" : "Open community chat"}
            className="relative w-14 h-14 rounded-full bg-forest shadow-xl flex items-center justify-center text-white"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={  { rotate:  90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ rotate:  90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={  { rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <MessageCircle size={21} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </>
  );
}
