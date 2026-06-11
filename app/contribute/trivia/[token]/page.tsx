"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventInfo {
  id:         string;
  title:      string;
  event_date: string;
  slug:       string;
}

interface Question {
  id:            string;
  question:      string;
  type:          "multiple_choice" | "open";
  options:       string[] | null;
  correct_index: number | null;
  category:      string;
  points:        number;
  created_at:    string;
}

const BLANK_MCQ = { question: "", type: "multiple_choice" as const, options: ["", "", "", ""], correct_index: 0, category: "General", points: 1 };

export default function TriviaContributePage() {
  const { token } = useParams<{ token: string }>();

  const [event,     setEvent]    = useState<EventInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState<string | null>(null);
  const [saving,    setSaving]   = useState(false);
  const [expandAdd, setExpandAdd] = useState(false);
  const [removing,  setRemoving] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState(BLANK_MCQ);
  const [qType, setQType] = useState<"multiple_choice" | "open">("multiple_choice");
  const [openAnswer, setOpenAnswer] = useState("");

  useEffect(() => {
    fetch(`/api/contribute/trivia?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setEvent(d.event);
        setQuestions(d.questions);
      })
      .catch(() => setError("Could not load page"))
      .finally(() => setLoading(false));
  }, [token]);

  async function submitQuestion() {
    if (!form.question.trim()) return;
    if (qType === "multiple_choice") {
      const filledOptions = form.options.filter(o => o.trim());
      if (filledOptions.length < 2) { setError("Fill in at least 2 options"); return; }
    }
    setSaving(true);
    setError(null);
    const body = qType === "multiple_choice"
      ? { question: form.question, type: qType, options: form.options.filter(o => o.trim()), correct_index: form.correct_index, category: form.category, points: form.points }
      : { question: form.question, type: qType, correct_answer: openAnswer, category: form.category, points: form.points };

    const res = await fetch(`/api/contribute/trivia?token=${token}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.question) {
      setQuestions(prev => [data.question, ...prev]);
      setForm(BLANK_MCQ);
      setOpenAnswer("");
      setExpandAdd(false);
    } else {
      setError(data.error ?? "Failed to save");
    }
    setSaving(false);
  }

  async function removeQuestion(id: string) {
    setRemoving(id);
    await fetch(`/api/contribute/trivia?token=${token}&id=${id}`, { method: "DELETE" });
    setQuestions(prev => prev.filter(q => q.id !== id));
    setRemoving(null);
  }

  const eventDate = event ? new Date(event.event_date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";

  if (loading) return (
    <div className="min-h-screen bg-[#f7f2e8] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[#1b3a2a]/30" />
    </div>
  );

  if (error && !event) return (
    <div className="min-h-screen bg-[#f7f2e8] flex items-center justify-center p-6">
      <div className="text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-[#1a1a18]/60">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f2e8]">
      {/* Header */}
      <div className="bg-[#1b3a2a] px-5 py-6">
        <p className="text-[11px] text-[#c9a24a] uppercase tracking-widest font-semibold mb-1">Trivia Contributor</p>
        <h1 className="text-xl font-bold text-[#f7f2e8] leading-tight">{event?.title}</h1>
        <p className="text-sm text-[#f7f2e8]/50 mt-1">{eventDate}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-[#1a1a18]/60 leading-relaxed">
          Add trivia questions for this session. The admin will select which ones to play on the night.
        </p>

        {/* Add question panel */}
        <div className="bg-white rounded-2xl border border-[#e8e3d8] overflow-hidden">
          <button
            onClick={() => setExpandAdd(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f7f2e8]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1b3a2a] flex items-center justify-center">
                <Plus size={13} className="text-[#c9a24a]" />
              </div>
              <span className="text-sm font-semibold text-[#1a1a18]">Add a question</span>
            </div>
            <ChevronDown size={14} className={cn("text-[#1a1a18]/30 transition-transform", expandAdd && "rotate-180")} />
          </button>

          {expandAdd && (
            <div className="px-5 pb-5 space-y-4 border-t border-[#e8e3d8]">
              <div className="pt-4">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">Question type</label>
                <div className="flex gap-2">
                  {(["multiple_choice", "open"] as const).map(t => (
                    <button key={t} onClick={() => setQType(t)}
                      className={cn("flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                        qType === t ? "bg-[#1b3a2a] text-[#f7f2e8] border-[#1b3a2a]" : "border-[#e8e3d8] text-[#1a1a18]/50 hover:border-[#1b3a2a]/30"
                      )}>
                      {t === "multiple_choice" ? "Multiple choice" : "Open / text"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">Question</label>
                <textarea
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  rows={2}
                  placeholder="Type your trivia question here…"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] placeholder:text-[#1a1a18]/30 focus:outline-none focus:border-[#1b3a2a]/40 resize-none"
                />
              </div>

              {qType === "multiple_choice" && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40">
                    Options — select the correct one
                  </label>
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        onClick={() => setForm(f => ({ ...f, correct_index: i }))}
                        className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          form.correct_index === i ? "bg-[#1b3a2a] border-[#1b3a2a]" : "border-[#e8e3d8] hover:border-[#1b3a2a]/40"
                        )}>
                        {form.correct_index === i && <CheckCircle2 size={10} className="text-[#f7f2e8]" />}
                      </button>
                      <input
                        value={opt}
                        onChange={e => setForm(f => { const ops = [...f.options]; ops[i] = e.target.value; return { ...f, options: ops }; })}
                        placeholder={`Option ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] placeholder:text-[#1a1a18]/25 focus:outline-none focus:border-[#1b3a2a]/40"
                      />
                    </div>
                  ))}
                </div>
              )}

              {qType === "open" && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">
                    Expected answer (optional)
                  </label>
                  <input
                    value={openAnswer}
                    onChange={e => setOpenAnswer(e.target.value)}
                    placeholder="e.g. The Holy Spirit, 42, Nairobi…"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] placeholder:text-[#1a1a18]/30 focus:outline-none focus:border-[#1b3a2a]/40"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">Category</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="General, Bible, Music…"
                    className="w-full px-3 py-2 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] placeholder:text-[#1a1a18]/25 focus:outline-none focus:border-[#1b3a2a]/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">Points</label>
                  <select value={form.points} onChange={e => setForm(f => ({ ...f, points: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] focus:outline-none focus:border-[#1b3a2a]/40">
                    {[1, 2, 3, 5].map(p => <option key={p} value={p}>{p} pt{p !== 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <AlertCircle size={12} /> {error}
                </div>
              )}

              <button
                onClick={submitQuestion}
                disabled={saving || !form.question.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1b3a2a] text-[#f7f2e8] text-sm font-bold hover:bg-[#2d5240] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? "Adding…" : "Add question"}
              </button>
            </div>
          )}
        </div>

        {/* Questions list */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40">
              {questions.length} question{questions.length !== 1 ? "s" : ""} added
            </p>
            {questions.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-[#e8e3d8] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-[#1b3a2a]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-[#1b3a2a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a18] leading-relaxed">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#1a1a18]/40 bg-[#1a1a18]/5 px-2 py-0.5 rounded-full capitalize">
                        {q.type === "multiple_choice" ? "MCQ" : "Open"}
                      </span>
                      <span className="text-[10px] text-[#1a1a18]/40">{q.category}</span>
                    </div>
                    {q.type === "multiple_choice" && q.options && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, i) => (
                          <div key={i} className={cn("flex items-center gap-1.5 text-xs",
                            i === q.correct_index ? "text-green-700 font-medium" : "text-[#1a1a18]/40"
                          )}>
                            <span>{i === q.correct_index ? "✓" : "·"}</span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeQuestion(q.id)} disabled={removing === q.id}
                    className="p-1.5 rounded-lg text-[#1a1a18]/25 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    {removing === q.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {questions.length === 0 && !expandAdd && (
          <div className="text-center py-8 text-[#1a1a18]/30">
            <Sparkles size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No questions yet — tap &ldquo;Add a question&rdquo; above to get started.</p>
          </div>
        )}

        <p className="text-center text-xs text-[#1a1a18]/30 pb-8">
          Questions will be available to the admin for this event.
        </p>
      </div>
    </div>
  );
}
