import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { EMAIL_TEMPLATES } from '@/lib/emailTemplates';

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get parents whose trial ends tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const { data: parents, error } = await supabase
      .from('parents')
      .select(`
        id,
        email,
        full_name,
        trial_end,
        subscription_status
      `)
      .eq('subscription_status', 'trial')
      .lte('trial_end', tomorrow.toISOString())
      .gte('trial_end', new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${parents.length} parents with trials ending tomorrow`);

    // Send email to each parent
    for (const parent of parents) {
      // Get scholar stats
      const { data: scholars } = await supabase
        .from('scholars')
        .select('id, name')
        .eq('parent_id', parent.id)
        .limit(1);

      if (!scholars || scholars.length === 0) continue;

      const scholar = scholars[0];

      // Get quiz stats
      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('score, total_questions')
        .eq('scholar_id', scholar.id);

      const quizzesCompleted = quizResults?.length || 0;
      const totalScore = quizResults?.reduce((sum, r) => sum + r.score, 0) || 0;
      const totalQuestions = quizResults?.reduce((sum, r) => sum + r.total_questions, 0) || 1;
      const avgAccuracy = Math.round((totalScore / totalQuestions) * 100);

      // Get badges
      const { data: badges } = await supabase
        .from('scholar_badges')
        .select('badge_id')
        .eq('scholar_id', scholar.id);

      const badgesEarned = badges?.length || 0;

      // Get XP
      const { data: scholarData } = await supabase
        .from('scholars')
        .select('total_xp')
        .eq('id', scholar.id)
        .single();

      const xpEarned = scholarData?.total_xp || 0;

      // Send email
      const template = EMAIL_TEMPLATES.trialEnding(
        parent.full_name,
        scholar.name,
        quizzesCompleted,
        xpEarned,
        badgesEarned,
        avgAccuracy
      );

      await sendEmail({
        to: [{ email: parent.email, name: parent.full_name }],
        subject: template.subject,
        htmlContent: template.htmlContent,
      });

      console.log(`Sent trial reminder to ${parent.email}`);
    }

    return NextResponse.json({ 
      success: true, 
      sent: parents.length 
    });
  } catch (error) {
    console.error('Error in trial reminders cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}