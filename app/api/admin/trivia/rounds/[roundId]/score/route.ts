import { NextRequest, NextResponse } from "next/server";
import { requireTriviaRoundAccess } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

type Params = { params: { roundId: string } };

// PATCH /api/admin/trivia/rounds/[roundId]/score
// Body: { scores: { id: string; is_correct: boolean }[] }
// Bulk-updates is_correct + admin_override on trivia_responses for open_input scoring
export async function PATCH(req: NextRequest, { params }: Params) {
  const { roundId } = params;
  const guard = await requireTriviaRoundAccess(roundId, req.nextUrl.searchParams.get("t"));
  if (!guard.ok) return guard.response;
  const supabase = guard.supabase;
  const body = await req.json() as { scores: { id: string; is_correct: boolean }[] };
  const { scores } = body;

  if (!Array.isArray(scores) || scores.length === 0)
    return NextResponse.json({ error: "scores array required" }, { status: 400 });

  await Promise.all(
    scores.map(({ id, is_correct }) =>
      supabase
        .from("trivia_responses")
        .update({ is_correct, admin_override: true })
        .eq("id", id)
        .eq("round_id", roundId)
    )
  );

  return NextResponse.json({ ok: true, scored: scores.length });
}
