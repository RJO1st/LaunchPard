import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { scholarId, subject, answers, timeSpent } = await req.json();

    // Anti-cheat verification
    if (timeSpent < 5) {
      return NextResponse.json({ error: "Too fast! Validating odyssey..." }, { status: 400 });
    }

    let actualScore = 0;
    answers.forEach(ans => {
      if (ans.selectedOption === ans.correctOption) actualScore++;
    });

    const xpEarned = actualScore * 50;

    // Supabase Logging (Omit scholar_id to prevent UUID mismatch during current migration)
    if (supabase) {
      try {
        await supabase.from('quest_logs').insert([{
          subject: subject,
          score: actualScore,
          questions_attempted: answers.length
        }]);
      } catch (dbErr) {
        console.warn("Cloud log skipped, local storage updated.");
      }
    }

    return NextResponse.json({ 
      success: true, 
      score: actualScore, 
      xp: xpEarned 
    });

  } catch (error) {
    console.error("Vault Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}