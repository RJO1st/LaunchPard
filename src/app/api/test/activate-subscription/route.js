// Example fix for /api/test/activate-subscription
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Create a test user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'test123',
    email_confirm: true, // auto‑confirm for testing
  });

  if (authError) throw authError;

  // 2. Now insert parent with the real user ID
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  const { error: parentError } = await supabase
    .from('parents')
    .insert({
      id: authData.user.id,
      full_name: 'Test User',
      email: 'test@example.com',
      subscription_status: 'trial',
      trial_end: trialEnd.toISOString(),
      max_children: 3,
      billing_cycle: 'monthly'
    });

  if (parentError) throw parentError;

  return Response.json({ success: true });
}