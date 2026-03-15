import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:hello@disciplio.app';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const COOLDOWN_MS = 2 * 60 * 60 * 1000;

serve(async (req) => {
  try {
    // Auth: extract the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const { partnership_id } = await req.json();
    if (!partnership_id) {
      return new Response(JSON.stringify({ error: 'partnership_id required' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch partnership
    const { data: partnership, error: pErr } = await supabase
      .from('partnerships')
      .select('*')
      .eq('id', partnership_id)
      .single();

    if (pErr || !partnership) {
      return new Response(JSON.stringify({ error: 'Partnership not found' }), { status: 404 });
    }

    // Verify the caller is part of this partnership
    if (partnership.user1_id !== user.id && partnership.user2_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not your partnership' }), { status: 403 });
    }

    // Cooldown check
    if (partnership.last_nudge_sent) {
      const elapsed = Date.now() - new Date(partnership.last_nudge_sent).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainMs = COOLDOWN_MS - elapsed;
        return new Response(
          JSON.stringify({ error: 'Cooldown active', remaining_ms: remainMs }),
          { status: 429 },
        );
      }
    }

    // Find the partner
    const partnerId =
      partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id;

    // Check if partner has push enabled
    const { data: partnerSub } = await supabase
      .from('push_subscriptions')
      .select('subscription, notifications_enabled')
      .eq('user_id', partnerId)
      .maybeSingle();

    if (!partnerSub || !partnerSub.notifications_enabled) {
      return new Response(
        JSON.stringify({ error: 'Partner has notifications disabled' }),
        { status: 422 },
      );
    }

    // Send the push notification
    const payload = JSON.stringify({
      title: 'Disciplio',
      body: 'Your partner is checking in on you 👋 Time to crush those habits!',
      tag: 'partner-nudge',
      url: '/dashboard',
    });

    await webpush.sendNotification(
      partnerSub.subscription as webpush.PushSubscription,
      payload,
    );

    // Update last_nudge_sent
    await supabase
      .from('partnerships')
      .update({ last_nudge_sent: new Date().toISOString() })
      .eq('id', partnership_id);

    return new Response(
      JSON.stringify({ ok: true, nudged: partnerId }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-nudge error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
