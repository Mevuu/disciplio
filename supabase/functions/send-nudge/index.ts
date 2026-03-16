import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:hello@disciplio.app';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const COOLDOWN_MS = 2 * 60 * 60 * 1000;

const ALLOWED_ORIGINS = [
  'https://disciplio.app',
  'https://www.disciplio.app',
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  const headers = { ...corsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // Auth: create a client using the caller's token so getUser() validates it
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
    });

    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const { partnership_id } = await req.json();
    if (!partnership_id) {
      return new Response(JSON.stringify({ error: 'partnership_id required' }), { status: 400, headers });
    }

    // Service-role client for DB operations that bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: partnership, error: pErr } = await supabase
      .from('partnerships')
      .select('*')
      .eq('id', partnership_id)
      .single();

    if (pErr || !partnership) {
      return new Response(JSON.stringify({ error: 'Partnership not found' }), { status: 404, headers });
    }

    if (partnership.user1_id !== user.id && partnership.user2_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not your partnership' }), { status: 403, headers });
    }

    if (partnership.last_nudge_sent) {
      const elapsed = Date.now() - new Date(partnership.last_nudge_sent).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainMs = COOLDOWN_MS - elapsed;
        return new Response(
          JSON.stringify({ error: 'Cooldown active', remaining_ms: remainMs }),
          { status: 429, headers },
        );
      }
    }

    const partnerId =
      partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id;

    const { data: partnerSub } = await supabase
      .from('push_subscriptions')
      .select('subscription, notifications_enabled')
      .eq('user_id', partnerId)
      .maybeSingle();

    if (!partnerSub || !partnerSub.notifications_enabled) {
      return new Response(
        JSON.stringify({ error: 'Partner has notifications disabled' }),
        { status: 422, headers },
      );
    }

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

    await supabase
      .from('partnerships')
      .update({ last_nudge_sent: new Date().toISOString() })
      .eq('id', partnership_id);

    return new Response(
      JSON.stringify({ ok: true, nudged: partnerId }),
      { headers },
    );
  } catch (err) {
    console.error('send-nudge error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  }
});
