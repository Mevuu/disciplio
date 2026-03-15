import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:hello@disciplio.app';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const MESSAGES_1PM = [
  'The day is still yours 💪 Check in your habits and keep the streak alive',
  'Hey — halfway through the day. How are your habits going? 🔥',
  'A quick check in goes a long way. Your streak is counting on you 💚',
];

const MESSAGES_8PM = [
  'Last chance to secure today\'s streak 🔥 You\'ve got this',
  'The day is almost done. Check your habits and protect that streak 💪',
  'One tap. Three habits. Keep the chain going 🔥',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function sendPush(
  subscription: webpush.PushSubscription,
  payload: Record<string, string>,
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    console.error('Push failed:', statusCode, (err as Error).message);
    return false;
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const checkpointParam = url.searchParams.get('checkpoint');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = todayStr();

    // Fetch all users with push enabled
    const { data: subs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')
      .eq('notifications_enabled', true);

    if (subsErr || !subs) {
      return new Response(JSON.stringify({ error: subsErr?.message }), { status: 500 });
    }

    let sent = 0;
    let partnerNudges = 0;

    for (const sub of subs) {
      const userId = sub.user_id;
      const subscription = sub.subscription as webpush.PushSubscription;

      // Check if user has fully completed today
      const { data: checkin } = await supabase
        .from('checkins')
        .select('fully_completed')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      const userDone = checkin?.fully_completed === true;

      // Habit reminder: only if NOT fully completed
      if (!userDone) {
        const messages = checkpointParam === '8pm' ? MESSAGES_8PM : MESSAGES_1PM;
        const ok = await sendPush(subscription, {
          title: 'Disciplio',
          body: pick(messages),
          tag: 'daily-reminder',
          url: '/dashboard',
        });
        if (ok) sent++;
      }

      // Partner nudge prompt (8PM only): user IS done, partner is NOT
      if (checkpointParam === '8pm' && userDone) {
        const { data: partnership } = await supabase
          .from('partnerships')
          .select('*')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .eq('status', 'active')
          .maybeSingle();

        if (partnership) {
          const partnerId =
            partnership.user1_id === userId ? partnership.user2_id : partnership.user1_id;

          const { data: partnerCheckin } = await supabase
            .from('checkins')
            .select('fully_completed')
            .eq('user_id', partnerId)
            .eq('date', today)
            .maybeSingle();

          if (!partnerCheckin?.fully_completed) {
            const ok = await sendPush(subscription, {
              title: 'Disciplio',
              body: "Your partner hasn't checked in yet 👀 Open the app to send them some motivation",
              tag: 'partner-nudge-prompt',
              url: '/dashboard#partner-section',
            });
            if (ok) partnerNudges++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, reminders_sent: sent, partner_nudges: partnerNudges }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
