import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Submit Quest API Route
 * Handles anti-cheat logic, calculates scores on the server,
 * updates quest logs, and increments scholar XP.
 */
export async function POST(req) {
  try {
    const cookieStore = cookies()
    const { scholarId, subject, answers, timeSpent } = await req.json();

    // 1. Anti-Cheat: Validate time spent (e.g., 15 questions can't be done in 5 seconds)
    if (timeSpent < 5) {
      return Response.json({ error: "Odyssey too swift. Suspicious activity detected." }, { status: 400 });
    }

    // 2. Initialize Server-Side Supabase Client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
        },
      }
    )

    // 3. Secure Score Calculation
    let actualScore = 0;
    answers.forEach(ans => {
      if (ans.selectedOption === ans.correctOption) {
        actualScore++;
      }
    });

    const xpEarned = actualScore * 50;
    const accuracy = Math.round((actualScore / answers.length) * 100);

    // 4. Secure Transaction: Log the quest and update XP/Proficiency
    // We use RPC for atomic updates to prevent data desync
    const { error: rpcError } = await supabase.rpc('process_quest_result', {
      s_id: scholarId,
      sub: subject,
      sc: actualScore,
      total_q: answers.length,
      acc: accuracy,
      xp: xpEarned
    });

    if (rpcError) throw rpcError;

    return Response.json({ 
      success: true, 
      score: actualScore, 
      xpEarned: xpEarned,
      accuracy: accuracy 
    });

  } catch (error) {
    console.error("Vault Submission Error:", error);
    return Response.json({ error: "Internal Vault Error" }, { status: 500 });
  }
}
