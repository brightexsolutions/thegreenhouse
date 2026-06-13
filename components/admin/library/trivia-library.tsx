"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, Plus, Trash2, Edit2, ChevronDown,
  CheckCircle2, MessageSquare, Loader2, X, BookOpen,
  Music2, Users, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

type TriviaQuestion = {
  id:            string;
  question:      string;
  type:          "multiple_choice" | "open_input";
  options:       string[] | null;
  correct_index: number | null;
  hint:          string | null;
  category:      string;
  points:        number;
  created_at:    string;
};

const CATEGORIES = [
  { value: "fun",       label: "Fun",         icon: Smile    },
  { value: "scripture", label: "Scripture",    icon: BookOpen },
  { value: "worship",   label: "Worship",      icon: Music2   },
  { value: "community", label: "Community",    icon: Users    },
  { value: "general",   label: "General",      icon: Sparkles },
];

const OPTION_LABELS = ["A", "B", "C", "D"];

const OPTION_COLORS = [
  { bg: "bg-gold/15",   border: "border-gold/40",   text: "text-gold",   dot: "bg-gold"   },
  { bg: "bg-forest/10", border: "border-forest/30", text: "text-forest", dot: "bg-forest" },
  { bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-600", dot: "bg-blue-500" },
  { bg: "bg-rose-50",   border: "border-rose-200",  text: "text-rose-600", dot: "bg-rose-500" },
];

type FormState = {
  question:      string;
  type:          "multiple_choice" | "open_input";
  options:       string[];
  correct_index: number;
  hint:          string;
  category:      string;
  points:        number;
};

const DEFAULT_FORM: FormState = {
  question:      "",
  type:          "multiple_choice",
  options:       ["", "", "", ""],
  correct_index: 0,
  hint:          "",
  category:      "fun",
  points:        10,
};

function inputCls(err?: boolean) {
  return cn(
    "w-full px-3 py-2.5 rounded-xl border text-sm text-charcoal bg-white",
    "placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all",
    err ? "border-red-300" : "border-mist hover:border-forest/20"
  );
}

export function TriviaLibrary() {
  const confirm = useConfirm();
  const [questions,  setQuestions]  = useState<TriviaQuestion[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<TriviaQuestion | null>(null);
  const [form,       setForm]       = useState<FormState>(DEFAULT_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [catFilter,  setCatFilter]  = useState<string>("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/trivia");
    if (res.ok) {
      const data = await res.json() as { questions: TriviaQuestion[] };
      setQuestions(data.questions);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(q: TriviaQuestion) {
    setEditing(q);
    setForm({
      question:      q.question,
      type:          q.type,
      options:       q.options?.length === 4 ? [...q.options] : ["", "", "", ""],
      correct_index: q.correct_index ?? 0,
      hint:          q.hint ?? "",
      category:      q.category,
      points:        q.points,
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); }

  async function saveForm() {
    setFormError(null);
    if (!form.question.trim()) { setFormError("Question text is required."); return; }
    if (form.type === "multiple_choice") {
      const filled = form.options.filter(o => o.trim());
      if (filled.length < 2) { setFormError("Add at least 2 options."); return; }
    }
    setSaving(true);
    const payload = {
      question:      form.question,
      type:          form.type,
      options:       form.type === "multiple_choice" ? form.options.filter(o => o.trim()) : null,
      correct_index: form.type === "multiple_choice" ? form.correct_index : null,
      hint:          form.hint || null,
      category:      form.category,
      points:        form.points,
    };

    const res = editing
      ? await fetch(`/api/admin/trivia/${editing.id}`, { method: "PUT",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/admin/trivia",                { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (res.ok) {
      await load();
      closeForm();
    } else {
      const err = await res.json().catch(() => ({}));
      setFormError(err.error ?? "Save failed.");
    }
    setSaving(false);
  }

  async function deleteQuestion(id: string) {
    const ok = await confirm({ message: "This trivia question will be permanently deleted.", destructive: true }); if (!ok) return;
    setDeleting(id);
    await fetch(`/api/admin/trivia/${id}`, { method: "DELETE" });
    setQuestions(prev => prev.filter(q => q.id !== id));
    setDeleting(null);
  }

  const filtered = catFilter === "all" ? questions : questions.filter(q => q.category === catFilter);

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCatFilter("all")}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              catFilter === "all" ? "bg-forest text-cream" : "bg-white border border-mist text-charcoal/60 hover:border-forest/30")}
          >
            All ({questions.length})
          </button>
          {CATEGORIES.map(({ value, label }) => {
            const count = questions.filter(q => q.category === value).length;
            if (count === 0) return null;
            return (
              <button
                key={value}
                onClick={() => setCatFilter(value)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  catFilter === value ? "bg-forest text-cream" : "bg-white border border-mist text-charcoal/60 hover:border-forest/30")}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-moss transition-colors flex-shrink-0"
        >
          <Plus size={14} /> New question
        </button>
      </div>

      {/* Question list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-forest/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-mist p-14 text-center">
          <Sparkles size={26} className="text-charcoal/15 mx-auto mb-3" />
          <p className="text-sm text-charcoal/40">No trivia questions yet</p>
          <p className="text-xs text-charcoal/25 mt-1">Create your first question to get started</p>
          <button onClick={openCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-moss transition-colors">
            Add question
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => {
            const cat   = CATEGORIES.find(c => c.value === q.category);
            const Icon  = cat?.icon ?? Sparkles;
            const isExp = expanded === q.id;
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-mist overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-off-white transition-colors"
                  onClick={() => setExpanded(isExp ? null : q.id)}
                >
                  {/* Type icon */}
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    q.type === "multiple_choice" ? "bg-gold/10" : "bg-blue-50")}>
                    {q.type === "multiple_choice"
                      ? <Sparkles size={14} className="text-gold" />
                      : <MessageSquare size={14} className="text-blue-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal leading-snug line-clamp-1">{q.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Icon size={10} className="text-charcoal/30" />
                      <span className="text-[10px] text-charcoal/40 capitalize">{q.category}</span>
                      <span className="text-[9px] text-charcoal/20">·</span>
                      <span className="text-[10px] text-charcoal/40">{q.points} pts</span>
                      {q.type === "multiple_choice" && (
                        <>
                          <span className="text-[9px] text-charcoal/20">·</span>
                          <span className="text-[10px] text-charcoal/40">{q.options?.length ?? 0} options</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(q); }}
                      className="p-1.5 rounded-lg text-charcoal/30 hover:text-forest hover:bg-forest/8 transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteQuestion(q.id); }}
                      disabled={deleting === q.id}
                      className="p-1.5 rounded-lg text-charcoal/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deleting === q.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                    <ChevronDown size={14} className={cn("text-charcoal/25 transition-transform duration-200", isExp && "rotate-180")} />
                  </div>
                </button>

                {isExp && (
                  <div className="border-t border-mist px-4 pb-4 pt-3 space-y-3">
                    {q.type === "multiple_choice" && q.options && (
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, i) => {
                          const col    = OPTION_COLORS[i % 4];
                          const correct = i === q.correct_index;
                          return (
                            <div key={i} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium",
                              correct ? "bg-green-50 border-green-200 text-green-700" : `${col.bg} ${col.border} ${col.text}`)}>
                              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                correct ? "bg-green-500 text-white" : `${col.dot} text-white`)}>
                                {OPTION_LABELS[i]}
                              </span>
                              <span className="truncate">{opt}</span>
                              {correct && <CheckCircle2 size={12} className="ml-auto flex-shrink-0 text-green-500" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.type === "open_input" && (
                      <p className="text-xs text-charcoal/50 italic">Open text response — no correct answer marked</p>
                    )}
                    {q.hint && (
                      <p className="text-xs text-charcoal/50">
                        <span className="font-semibold text-charcoal/60">Hint:</span> {q.hint}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-mist flex-shrink-0">
              <h3 className="font-display text-lg font-semibold text-forest">
                {editing ? "Edit question" : "New trivia question"}
              </h3>
              <button onClick={closeForm} className="p-1.5 rounded-xl text-charcoal/40 hover:bg-charcoal/8 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              {/* Type toggle */}
              <div>
                <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-2">Type</p>
                <div className="flex gap-2">
                  {(["multiple_choice", "open_input"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={cn("flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all",
                        form.type === t
                          ? "bg-forest text-cream border-forest"
                          : "bg-white text-charcoal/60 border-mist hover:border-forest/30")}
                    >
                      {t === "multiple_choice" ? "Multiple choice" : "Open response"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question text */}
              <div>
                <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Question</p>
                <textarea
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  rows={2}
                  placeholder="What is the first book of the Bible?"
                  className={cn(inputCls(), "resize-none")}
                />
              </div>

              {/* Options (MC only) */}
              {form.type === "multiple_choice" && (
                <div>
                  <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-2">
                    Options — tap the letter to mark correct answer
                  </p>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => {
                      const col     = OPTION_COLORS[i % 4];
                      const correct = form.correct_index === i;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <button
                            onClick={() => setForm(f => ({ ...f, correct_index: i }))}
                            className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all border-2",
                              correct
                                ? "bg-green-500 text-white border-green-500"
                                : `${col.bg} ${col.text} border-transparent hover:border-current`)}
                          >
                            {correct ? "✓" : OPTION_LABELS[i]}
                          </button>
                          <input
                            value={opt}
                            onChange={e => setForm(f => {
                              const opts = [...f.options];
                              opts[i] = e.target.value;
                              return { ...f, options: opts };
                            })}
                            placeholder={`Option ${OPTION_LABELS[i]}…`}
                            className={inputCls()}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category + Points row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Category</p>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className={inputCls()}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Points</p>
                  <input
                    type="number"
                    min={1} max={100}
                    value={form.points}
                    onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 10 }))}
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* Hint */}
              <div>
                <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">Hint <span className="normal-case text-charcoal/30 font-normal">(optional)</span></p>
                <input
                  value={form.hint}
                  onChange={e => setForm(f => ({ ...f, hint: e.target.value }))}
                  placeholder="A gentle nudge to help attendees…"
                  className={inputCls()}
                />
              </div>

              {formError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{formError}</p>
              )}
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-mist flex-shrink-0 flex gap-3">
              <button onClick={closeForm} className="flex-1 py-3 rounded-xl border border-mist text-sm text-charcoal/60 hover:bg-charcoal/5 transition-colors">
                Cancel
              </button>
              <button onClick={saveForm} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : (editing ? "Save changes" : "Create question")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
