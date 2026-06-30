import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const SOURCE_LABELS: Record<string, string> = {
  friend:    "A Friend",
  whatsapp:  "WhatsApp",
  instagram: "Instagram",
  church:    "Church / Community",
  website:   "Website",
  other:     "Other",
};

const ROLE_LABELS: Record<string, string> = {
  guest:           "Guest",
  vocalist:        "Vocalist",
  instrumentalist: "Instrumentalist",
  vision_carrier:  "Vision Carrier",
  curious:         "Just Curious",
};

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function fmtDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-KE", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch { return date; }
}

function fmtTime(time: string) {
  try {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch { return time; }
}

function statBox(label: string, value: string | number, sub?: string) {
  return `
    <div class="stat-box">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
      ${sub ? `<div class="stat-sub">${sub}</div>` : ""}
    </div>`;
}

function row(label: string, count: number, total: number) {
  return `
    <div class="row">
      <span class="row-label">${label}</span>
      <span class="row-count">${count}</span>
      <span class="row-bar-wrap"><span class="row-bar" style="width:${pct(count, total)}"></span></span>
      <span class="row-pct">${pct(count, total)}</span>
    </div>`;
}

export async function GET(req: NextRequest, { params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const [
    { data: event },
    { data: regs },
    { data: feedback },
    { data: rounds },
  ] = await Promise.all([
    admin
      .from("events")
      .select("title, event_date, event_time, venue_name, theme_title, theme_scripture, status")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    admin
      .from("registrations")
      .select("role, source, email, phone, checked_in, is_walkin")
      .eq("event_id", id)
      .is("deleted_at", null),
    admin
      .from("feedback_submissions")
      .select("name, message, attended")
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("trivia_rounds")
      .select("id, status, trivia_questions(question, type, options, correct_index, points), trivia_responses(attendee_name, is_correct, answer_text)")
      .eq("event_id", id),
  ]);

  if (!event) return new NextResponse("Event not found", { status: 404 });

  const allRegs = regs ?? [];
  const allFeedback = feedback ?? [];
  const allRounds = rounds ?? [];

  // ── Registration stats ──────────────────────────────────────────────────────
  const totalReg = allRegs.length;
  const emailRegs = allRegs.filter(r => r.email).length;
  const phoneOnlyRegs = totalReg - emailRegs;

  const bySource: Record<string, number> = {};
  const byRole:   Record<string, number> = {};
  for (const r of allRegs) {
    if (r.source) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
    if (r.role)   byRole[r.role]     = (byRole[r.role]   ?? 0) + 1;
  }

  // ── Attendance stats ────────────────────────────────────────────────────────
  const checkedIn   = allRegs.filter(r => r.checked_in).length;
  const walkins     = allRegs.filter(r => r.is_walkin && r.checked_in).length;
  const preRegShown = checkedIn - walkins;
  const noShows     = totalReg - walkins - preRegShown;   // pre-registered who didn't show
  const attRate     = pct(checkedIn, totalReg + walkins > totalReg ? checkedIn : totalReg);

  // ── Trivia stats ────────────────────────────────────────────────────────────
  type TriviaQuestion = { type: string; points: number };
  type TriviaResponse = { attendee_name: string | null; is_correct: boolean | null };
  type RoundData = { trivia_questions: TriviaQuestion | null; trivia_responses: TriviaResponse[] };

  const roundsPlayed = allRounds.length;
  let totalMcResponses = 0;
  let totalCorrect = 0;

  type Participant = { name: string; answered: number; correct: number; points: number };
  const participantMap: Record<string, Participant> = {};

  for (const round of allRounds as unknown as RoundData[]) {
    const q = round.trivia_questions;
    const pts = q?.points ?? 10;
    const isMC = q?.type === "multiple_choice";
    for (const resp of round.trivia_responses ?? []) {
      const name = resp.attendee_name?.trim();
      if (!name) continue;
      if (!participantMap[name]) participantMap[name] = { name, answered: 0, correct: 0, points: 0 };
      participantMap[name].answered += 1;
      if (isMC) {
        totalMcResponses += 1;
        if (resp.is_correct) {
          totalCorrect += 1;
          participantMap[name].correct += 1;
          participantMap[name].points += pts;
        }
      }
    }
  }

  const leaderboard = Object.values(participantMap)
    .sort((a, b) => b.points - a.points || b.correct - a.correct || a.name.localeCompare(b.name));
  const uniqueCount  = leaderboard.length;
  const correctRate  = pct(totalCorrect, totalMcResponses);
  const topScorer    = leaderboard[0];
  const hasMcRounds  = (allRounds as unknown as RoundData[]).some(r => r.trivia_questions?.type === "multiple_choice");

  // Sample feedback messages (up to 6, non-empty)
  const sampleMessages = allFeedback
    .filter(f => f.message?.trim())
    .slice(0, 6);

  const generatedOn = new Date().toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Build source/role rows (sorted descending) ──────────────────────────────
  const sourceRows = Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => row(SOURCE_LABELS[k] ?? k, v, totalReg))
    .join("");

  const roleRows = Object.entries(byRole)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => row(ROLE_LABELS[k] ?? k, v, totalReg))
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${event.title} — Event Summary</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 1.8cm 1.5cm; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1c2419;
    background: #fff;
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    font-size: 14px;
    line-height: 1.55;
  }

  /* ── Print action bar ── */
  .print-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f4f2ec;
    border: 1px solid #e4e0d4;
    border-radius: 8px;
    padding: 10px 16px;
    margin-bottom: 28px;
    gap: 12px;
  }
  .print-bar-note { font-size: 12px; color: #5a6050; }
  .print-btn {
    background: #2D5016;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .print-btn:hover { background: #3e6b20; }
  @media print { .print-bar { display: none; } }

  /* ── Report header ── */
  .report-header {
    border-bottom: 2px solid #2D5016;
    padding-bottom: 18px;
    margin-bottom: 28px;
  }
  .org-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #8a7c3a;
    margin-bottom: 6px;
  }
  .event-title {
    font-size: 24px;
    font-weight: 700;
    color: #1c2419;
    line-height: 1.2;
    margin-bottom: 8px;
  }
  .event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    font-size: 13px;
    color: #4a5544;
  }
  .event-meta span::before { content: "•"; margin-right: 5px; color: #8a7c3a; }
  .event-meta span:first-child::before { display: none; }
  .theme-note {
    margin-top: 10px;
    font-size: 12.5px;
    color: #4a5544;
    font-style: italic;
    padding-left: 1px;
  }
  .generated-on {
    margin-top: 10px;
    font-size: 11px;
    color: #9a9a8a;
  }

  /* ── Sections ── */
  .section {
    margin-bottom: 30px;
  }
  .section-heading {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #2D5016;
    border-bottom: 1px solid #dfe8d8;
    padding-bottom: 6px;
    margin-bottom: 16px;
  }

  /* ── Stat boxes ── */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }
  .stat-box {
    background: #f7f5ef;
    border: 1px solid #e4e0d4;
    border-radius: 8px;
    padding: 14px 12px;
    text-align: center;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #1c2419;
    line-height: 1;
  }
  .stat-label {
    font-size: 11px;
    color: #6a7560;
    margin-top: 4px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .stat-sub {
    font-size: 11px;
    color: #8a7c3a;
    margin-top: 3px;
  }

  /* ── Breakdown rows ── */
  .breakdown-label {
    font-size: 12px;
    font-weight: 600;
    color: #4a5544;
    margin-bottom: 8px;
    margin-top: 14px;
  }
  .row {
    display: grid;
    grid-template-columns: 160px 36px 1fr 44px;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .row-label { font-size: 13px; color: #1c2419; }
  .row-count { font-size: 13px; font-weight: 600; color: #1c2419; text-align: right; }
  .row-bar-wrap { background: #e8ede4; border-radius: 99px; height: 7px; overflow: hidden; }
  .row-bar { height: 100%; background: #2D5016; border-radius: 99px; }
  .row-pct { font-size: 12px; color: #6a7560; text-align: right; }

  /* ── Feedback messages ── */
  .message-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (max-width: 540px) { .message-grid { grid-template-columns: 1fr; } }
  .message-card {
    background: #f7f5ef;
    border: 1px solid #e4e0d4;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13px;
    color: #2a3024;
    line-height: 1.5;
    position: relative;
  }
  .message-author {
    display: block;
    font-size: 11px;
    color: #8a9080;
    margin-top: 6px;
    font-weight: 600;
  }
  .no-data { font-size: 13px; color: #9a9a8a; font-style: italic; }

  /* ── Trivia ── */
  .highlight-box {
    background: #f0f5ea;
    border: 1px solid #c2d5b4;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13px;
    color: #2D5016;
    margin-top: 10px;
  }
  .highlight-box strong { font-weight: 700; }

  /* ── Leaderboard table ── */
  .leaderboard-wrap {
    margin-top: 16px;
    border: 1px solid #e4e0d4;
    border-radius: 8px;
    overflow: hidden;
  }
  .lb-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .lb-table thead tr {
    background: #f0f5ea;
  }
  .lb-table th {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #4a5544;
    padding: 9px 12px;
    text-align: left;
    border-bottom: 1px solid #dfe8d8;
  }
  .lb-table th.right, .lb-table td.right { text-align: right; }
  .lb-table td {
    padding: 9px 12px;
    color: #1c2419;
    border-bottom: 1px solid #f0ede8;
  }
  .lb-table tr:last-child td { border-bottom: none; }
  .lb-table tbody tr:nth-child(even) { background: #faf9f6; }
  .lb-table tbody tr:hover { background: #f4f2ec; }
  .lb-rank { font-weight: 700; font-size: 13px; width: 40px; }
  .lb-name { font-weight: 600; }
  .lb-pts  { font-weight: 700; color: #2D5016; }
  .lb-dim  { color: #8a9080; }
  @media print {
    .lb-table tbody tr:hover { background: inherit; }
  }

  /* ── Footer ── */
  .report-footer {
    margin-top: 48px;
    padding-top: 14px;
    border-top: 1px solid #dfe8d8;
    font-size: 11px;
    color: #aaa;
    display: flex;
    justify-content: space-between;
  }
  @media print {
    body { padding: 0; }
    .section { break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Print bar -->
<div class="print-bar">
  <span class="print-bar-note">To save as PDF — click Print and choose <em>Save as PDF</em> from your printer options.</span>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
</div>

<!-- Header -->
<div class="report-header">
  <div class="org-label">The Green House W.S — Event Summary</div>
  <h1 class="event-title">${event.title}</h1>
  <div class="event-meta">
    <span>${fmtDate(event.event_date)}</span>
    <span>${fmtTime(event.event_time)}</span>
    ${event.venue_name ? `<span>${event.venue_name}</span>` : ""}
  </div>
  ${event.theme_title ? `<div class="theme-note">Theme: <strong>${event.theme_title}</strong>${event.theme_scripture ? ` — ${event.theme_scripture}` : ""}</div>` : ""}
  <div class="generated-on">Report generated on ${generatedOn}</div>
</div>

<!-- ── 1. Registrations ──────────────────────────────────────────────── -->
<div class="section">
  <div class="section-heading">Registrations</div>

  ${totalReg === 0 ? `<p class="no-data">No registrations recorded for this event.</p>` : `
  <div class="stat-grid">
    ${statBox("Total Registered", totalReg)}
    ${statBox("With Email", emailRegs, `${pct(emailRegs, totalReg)} of registrants`)}
    ${statBox("Phone Only", phoneOnlyRegs, `${pct(phoneOnlyRegs, totalReg)} of registrants`)}
  </div>

  ${Object.keys(bySource).length > 0 ? `
  <div class="breakdown-label">How they heard about it</div>
  ${sourceRows}
  ` : ""}

  ${Object.keys(byRole).length > 0 ? `
  <div class="breakdown-label">Who registered</div>
  ${roleRows}
  ` : ""}
  `}
</div>

<!-- ── 2. Attendance ──────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-heading">Attendance on the Day</div>

  ${checkedIn === 0 && totalReg === 0 ? `<p class="no-data">No attendance data yet.</p>` : `
  <div class="stat-grid">
    ${statBox("Showed Up", checkedIn, `${attRate} attendance rate`)}
    ${statBox("Pre-Registered", preRegShown, "checked in")}
    ${statBox("Walk-ins", walkins, "at the door")}
    ${noShows > 0 ? statBox("Didn't Show", noShows, "registered, not seen") : ""}
  </div>
  `}
</div>

<!-- ── 3. Feedback ────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-heading">Session Feedback</div>

  ${allFeedback.length === 0 ? `<p class="no-data">No feedback submissions for this event.</p>` : `
  <div class="stat-grid">
    ${statBox("Responses", allFeedback.length)}
    ${statBox("In Person", allFeedback.filter(f => f.attended).length, "marked attended")}
    ${statBox("Remote", allFeedback.filter(f => !f.attended).length, "watched online")}
  </div>

  ${sampleMessages.length > 0 ? `
  <div class="breakdown-label">A few voices from the room</div>
  <div class="message-grid">
    ${sampleMessages.map(f => `
      <div class="message-card">
        "${f.message.length > 160 ? f.message.slice(0, 157) + "…" : f.message}"
        ${f.name ? `<span class="message-author">— ${f.name}</span>` : ""}
      </div>`).join("")}
  </div>` : ""}
  `}
</div>

<!-- ── 4. Trivia ──────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-heading">Trivia Participation</div>

  ${roundsPlayed === 0 ? `<p class="no-data">No trivia rounds were run for this event.</p>` : `
  <div class="stat-grid">
    ${statBox("Rounds Played", roundsPlayed)}
    ${statBox("Participants", uniqueCount, "unique players")}
    ${hasMcRounds && totalMcResponses > 0 ? statBox("Got It Right", `${totalCorrect} / ${totalMcResponses}`, `${correctRate} correct rate`) : ""}
  </div>

  ${topScorer ? `
  <div class="highlight-box">
    🏆 <strong>${topScorer.name}</strong> led the leaderboard${hasMcRounds ? ` with <strong>${topScorer.correct}</strong> correct answer${topScorer.correct !== 1 ? "s" : ""} and <strong>${topScorer.points} pts</strong>` : ""}.
  </div>` : ""}

  ${leaderboard.length > 0 ? `
  <div class="breakdown-label" style="margin-top:18px">How each participant did</div>
  <div class="leaderboard-wrap">
    <table class="lb-table">
      <thead>
        <tr>
          <th style="width:40px">#</th>
          <th>Name</th>
          <th class="right">Rounds Joined</th>
          ${hasMcRounds ? `<th class="right">Correct</th><th class="right">Score</th>` : ""}
        </tr>
      </thead>
      <tbody>
        ${leaderboard.map((p, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
          return `<tr>
            <td class="lb-rank">${medal}</td>
            <td class="lb-name">${p.name}</td>
            <td class="right lb-dim">${p.answered} of ${roundsPlayed}</td>
            ${hasMcRounds ? `<td class="right">${p.correct}</td><td class="right lb-pts">${p.points} pts</td>` : ""}
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>` : ""}
  `}
</div>

<!-- Footer -->
<div class="report-footer">
  <span>The Green House W.S · greenhousews.co.ke</span>
  <span>Confidential — for internal team use</span>
</div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
