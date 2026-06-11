"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, CheckCircle2, X, Edit2, Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type TriviaRound = {
  id:            string;
  status:        "active" | "revealing" | "closed";
  question:      string;
  type:          "multiple_choice" | "open_input";
  options:       string[] | null;
  correct_index: number | null;
  timer_seconds: number | null;
  started_at:    string;
  points:        number;
  hint:          string | null;
};

type Results = { total: number; correct: number; tally: Record<number, number> };

interface Props {
  roundId:  string;
  onClose?: () => void;
}

const OPTION_COLORS = [
  { base: "from-amber-400/20 to-amber-500/10 border-amber-400/40 text-amber-700",   selected: "from-amber-400/40 to-amber-500/30 border-amber-500",   label: "bg-amber-400 text-amber-900"    },
  { base: "from-emerald-400/20 to-emerald-500/10 border-emerald-400/40 text-emerald-700", selected: "from-emerald-400/40 to-emerald-500/30 border-emerald-500", label: "bg-emerald-500 text-white"      },
  { base: "from-sky-400/20 to-sky-500/10 border-sky-400/40 text-sky-700",           selected: "from-sky-400/40 to-sky-500/30 border-sky-500",           label: "bg-sky-500 text-white"          },
  { base: "from-rose-400/20 to-rose-500/10 border-rose-400/40 text-rose-700",       selected: "from-rose-400/40 to-rose-500/30 border-rose-500",         label: "bg-rose-500 text-white"         },
];

const OPTION_LABELS = ["A", "B", "C", "D"];

const NAME_KEY = "trivia_attendee_name";

function getStoredName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
}
function saveName(name: string) {
  try { localStorage.setItem(NAME_KEY, name); } catch { /* ignore */ }
}

export function TriviaAttendeeCard({ roundId, onClose }: Props) {
  const [round,          setRound]         = useState<TriviaRound | null>(null);
  const [results,        setResults]       = useState<Results | null>(null);
  const [name,           setName]          = useState(getStoredName);
  const [editingName,    setEditingName]   = useState(false);
  const [nameInput,      setNameInput]     = useState(getStoredName);
  const [selectedIndex,  setSelectedIndex] = useState<number | null>(null);
  const [openAnswer,     setOpenAnswer]    = useState("");
  const [submitted,      setSubmitted]     = useState(false);
  const [isCorrect,      setIsCorrect]     = useState<boolean | null>(null);
  const [submitting,     setSubmitting]    = useState(false);
  const [timeLeft,       setTimeLeft]      = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Fetch round details
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const [rRes, resRes] = await Promise.all([
          fetch(`/api/trivia/${roundId}`, { cache: "no-store" }),
          fetch(`/api/trivia/${roundId}/results`, { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (rRes.ok)   setRound(await rRes.json() as TriviaRound);
        if (resRes.ok) setResults(await resRes.json() as Results);
      } catch { /* ignore */ }
    }
    poll();
    const id = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [roundId]);

  // Countdown timer
  useEffect(() => {
    if (!round?.timer_seconds || !round.started_at || submitted) return;
    const end = new Date(round.started_at).getTime() + round.timer_seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimeLeft(left);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [round?.timer_seconds, round?.started_at, submitted]);

  function savePersistName() {
    const trimmed = nameInput.trim();
    setName(trimmed);
    saveName(trimmed);
    setEditingName(false);
  }

  async function submitAnswer() {
    if (submitting || submitted) return;
    if (round?.type === "multiple_choice" && selectedIndex === null) return;
    if (round?.type === "open_input" && !openAnswer.trim()) return;

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      answer_text:   round?.type === "multiple_choice"
        ? (round.options?.[selectedIndex!] ?? "")
        : openAnswer.trim(),
      answer_index:  round?.type === "multiple_choice" ? selectedIndex : undefined,
      attendee_name: name || undefined,
    };
    try {
      const res = await fetch(`/api/trivia/${roundId}/respond`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json() as { is_correct: boolean | null };
        setSubmitted(true);
        setIsCorrect(data.is_correct);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  const isRevealing = round?.status === "revealing";
  const isClosed    = round?.status === "closed";
  const total       = results?.total ?? 0;
  const tally       = results?.tally ?? {};

  if (!round) {
    return (
      <div className="rounded-3xl border border-gold/20 bg-white p-6 flex items-center justify-center gap-3">
        <Loader2 size={18} className="animate-spin text-forest/30" />
        <p className="text-sm text-charcoal/40">Loading trivia…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{   opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="rounded-3xl overflow-hidden border border-gold/30 shadow-lg shadow-gold/5"
      style={{ background: "linear-gradient(135deg, #1b3a2a 0%, #0d2018 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gold/20 flex items-center justify-center">
            <Sparkles size={12} className="text-gold" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold">Trivia Time</span>
          {!submitted && !isRevealing && round.status === "active" && (
            <span className="flex items-center gap-1 text-[9px] text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Timer */}
          {timeLeft !== null && round.status === "active" && !submitted && (
            <div className={cn("text-sm font-bold tabular-nums px-2 py-0.5 rounded-full",
              timeLeft > 15 ? "text-gold bg-gold/15" : "text-rose-400 bg-rose-400/15 animate-pulse")}>
              {timeLeft}s
            </div>
          )}
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 rounded-xl bg-cream/10 hover:bg-cream/20 flex items-center justify-center text-cream/40 hover:text-cream/70 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Name bar */}
      <div className="px-4 pb-3">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              ref={nameRef}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") savePersistName(); if (e.key === "Escape") setEditingName(false); }}
              placeholder="Your name (optional)"
              autoFocus
              className="flex-1 px-3 py-1.5 rounded-xl bg-cream/10 border border-cream/15 text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold"
            />
            <button onClick={savePersistName} className="px-3 py-1.5 rounded-xl bg-gold text-forest text-xs font-semibold">Save</button>
          </div>
        ) : (
          <button onClick={() => { setNameInput(name); setEditingName(true); }}
            className="flex items-center gap-1.5 text-xs text-cream/40 hover:text-cream/70 transition-colors">
            <Edit2 size={10} />
            {name ? <span>Playing as <span className="text-cream/70 font-semibold">{name}</span></span> : "Add your name (optional)"}
          </button>
        )}
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Question */}
        <p className="text-cream font-semibold text-sm md:text-base leading-snug">{round.question}</p>

        {round.hint && !submitted && round.status === "active" && (
          <p className="text-xs text-cream/40 italic">💡 {round.hint}</p>
        )}

        {/* Multiple choice options */}
        {round.type === "multiple_choice" && round.options && !submitted && round.status === "active" && (
          <div className="grid grid-cols-2 gap-2">
            {round.options.map((opt, i) => {
              const col      = OPTION_COLORS[i % 4];
              const isChosen = selectedIndex === i;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedIndex(i)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2.5 rounded-2xl border bg-gradient-to-br text-xs font-semibold text-left transition-all",
                    isChosen ? col.selected : col.base
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0", col.label)}>
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="leading-tight">{opt}</span>
                  {isChosen && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-white/60 flex items-center justify-center"
                    >
                      <CheckCircle2 size={10} className="text-forest" />
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Open input */}
        {round.type === "open_input" && !submitted && round.status === "active" && (
          <textarea
            value={openAnswer}
            onChange={e => setOpenAnswer(e.target.value)}
            placeholder="Type your answer…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-2xl bg-cream/10 border border-cream/15 text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold resize-none"
          />
        )}

        {/* Submit button */}
        {!submitted && round.status === "active" && (
          <button
            onClick={submitAnswer}
            disabled={
              submitting ||
              (round.type === "multiple_choice" && selectedIndex === null) ||
              (round.type === "open_input" && !openAnswer.trim())
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold hover:bg-gold-light text-forest text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader2 size={13} className="animate-spin" />Locking in…</>
              : <><Send size={12} />Lock in answer</>}
          </button>
        )}

        {/* Submission confirmation */}
        {submitted && !isRevealing && !isClosed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 py-3 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-green-400" />
            </div>
            <p className="text-sm font-semibold text-cream">Answer locked in!</p>
            <p className="text-xs text-cream/40">Waiting for the host to reveal the answer…</p>
          </motion.div>
        )}

        {/* Reveal state — show results + feedback */}
        <AnimatePresence>
          {(isRevealing || isClosed) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Correct/wrong for MC */}
              {submitted && round.type === "multiple_choice" && isCorrect !== null && (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl",
                    isCorrect ? "bg-green-500/20 border border-green-500/30" : "bg-rose-500/15 border border-rose-500/20")}
                >
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                    isCorrect ? "bg-green-500/30" : "bg-rose-500/20")}>
                    {isCorrect ? <Trophy size={18} className="text-green-400" /> : <X size={16} className="text-rose-400" />}
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", isCorrect ? "text-green-300" : "text-rose-300")}>
                      {isCorrect ? "You got it! 🎉" : "Not quite!"}
                    </p>
                    {!isCorrect && round.correct_index != null && round.options && (
                      <p className="text-[10px] text-cream/50 mt-0.5">
                        Answer: <span className="text-cream/80 font-semibold">{round.options[round.correct_index]}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Result bars for MC */}
              {round.type === "multiple_choice" && round.options && (
                <div className="space-y-1.5">
                  {round.options.map((opt, i) => {
                    const col       = OPTION_COLORS[i % 4];
                    const votes     = tally[i] ?? 0;
                    const pct       = total > 0 ? Math.round((votes / total) * 100) : 0;
                    const isCorrectOpt = i === round.correct_index;
                    const wasPicked = submitted && selectedIndex === i;
                    return (
                      <div key={i} className="relative rounded-xl overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1, duration: 0.7, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 rounded-xl"
                          style={{ background: isCorrectOpt ? "rgba(74,195,120,0.25)" : "rgba(255,255,255,0.06)" }}
                        />
                        <div className="relative flex items-center gap-2 px-3 py-2">
                          <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0", col.label)}>
                            {OPTION_LABELS[i]}
                          </span>
                          <span className={cn("text-xs flex-1", isCorrectOpt ? "text-green-300 font-semibold" : "text-cream/70")}>
                            {opt}
                            {wasPicked && <span className="ml-1.5 text-[9px] text-cream/40">(your pick)</span>}
                          </span>
                          <span className="text-[10px] font-bold tabular-nums"
                            style={{ color: isCorrectOpt ? "#4ec378" : "rgba(247,242,232,0.45)" }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-cream/30 text-center">{total} response{total !== 1 ? "s" : ""}</p>
                </div>
              )}

              {/* Open input reveal */}
              {round.type === "open_input" && (
                <div className="text-center py-2">
                  <p className="text-sm text-cream/60">{total} response{total !== 1 ? "s" : ""} submitted</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Closed state — no submission */}
        {isClosed && !submitted && (
          <div className="text-center py-2">
            <p className="text-xs text-cream/35">This round has ended</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
