import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const MODAL_DISMISSED_KEY = 'disciplio-notif-dismissed';
const MODAL_SNOOZE_KEY = 'disciplio-notif-snooze-until';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function shouldShowNotificationModal() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[push] Browser does not support SW or PushManager');
    return false;
  }
  if (!VAPID_PUBLIC_KEY) {
    console.log('[push] VITE_VAPID_PUBLIC_KEY is missing from env');
    return false;
  }
  if (Notification.permission === 'granted') {
    console.log('[push] Permission already granted — modal not needed');
    return false;
  }
  if (Notification.permission === 'denied') {
    console.log('[push] Permission denied by user');
    return false;
  }
  if (localStorage.getItem(MODAL_DISMISSED_KEY) === 'permanent') {
    console.log('[push] Modal was permanently dismissed');
    return false;
  }

  const snoozeUntil = localStorage.getItem(MODAL_SNOOZE_KEY);
  if (snoozeUntil && Date.now() < parseInt(snoozeUntil, 10)) {
    console.log('[push] Modal snoozed until', new Date(parseInt(snoozeUntil, 10)).toISOString());
    return false;
  }

  return true;
}

export function dismissModalPermanently() {
  localStorage.setItem(MODAL_DISMISSED_KEY, 'permanent');
}

export function snoozeModal() {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem(MODAL_SNOOZE_KEY, String(Date.now() + sevenDays));
}

export function resetNotificationPreference() {
  localStorage.removeItem(MODAL_DISMISSED_KEY);
  localStorage.removeItem(MODAL_SNOOZE_KEY);
}

export async function subscribeToPush(userId) {
  console.log('[push] subscribeToPush called for user:', userId);
  console.log('[push] VAPID_PUBLIC_KEY present:', !!VAPID_PUBLIC_KEY, '| length:', VAPID_PUBLIC_KEY?.length);

  if (!VAPID_PUBLIC_KEY) {
    console.error('[push] ABORT — no VAPID public key');
    return false;
  }

  try {
    // Step 1: Wait for the service worker to be ready
    console.log('[push] Waiting for service worker ready…');
    const registration = await navigator.serviceWorker.ready;
    console.log('[push] Service worker ready — scope:', registration.scope);

    // Step 2: Request browser permission explicitly (needed for some browsers)
    const permission = await Notification.requestPermission();
    console.log('[push] Notification.requestPermission() result:', permission);
    if (permission !== 'granted') {
      console.warn('[push] Permission not granted — aborting');
      return false;
    }

    // Step 3: Subscribe to push via the PushManager
    console.log('[push] Calling pushManager.subscribe…');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const subJson = subscription.toJSON();
    console.log('[push] PushSubscription obtained:', JSON.stringify(subJson, null, 2));

    if (!subJson || !subJson.endpoint) {
      console.error('[push] Subscription object is empty or missing endpoint');
      return false;
    }

    // Step 4: Save to Supabase
    console.log('[push] Saving to push_subscriptions for user_id:', userId);
    const { data, error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        subscription: subJson,
        notifications_enabled: true,
      },
      { onConflict: 'user_id' }
    ).select();

    if (error) {
      console.error('[push] Supabase upsert FAILED:', error.message, error.details, error.hint);
      return false;
    }

    console.log('[push] Supabase upsert SUCCESS:', data);
    dismissModalPermanently();
    return true;
  } catch (err) {
    console.error('[push] subscribeToPush EXCEPTION:', err);
    return false;
  }
}

export async function repairMissingSubscription(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!VAPID_PUBLIC_KEY) return;
  if (Notification.permission !== 'granted') return;

  console.log('[push-repair] Checking for existing row for user:', userId);

  const { data, error: selectErr } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectErr) {
    console.error('[push-repair] Select error:', selectErr.message);
    return;
  }

  if (data) {
    console.log('[push-repair] Row already exists — no repair needed');
    return;
  }

  console.log('[push-repair] No row found — re-registering subscription');

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const subJson = subscription.toJSON();
    console.log('[push-repair] PushSubscription:', JSON.stringify(subJson, null, 2));

    const { data: saved, error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        subscription: subJson,
        notifications_enabled: true,
      },
      { onConflict: 'user_id' }
    ).select();

    if (error) {
      console.error('[push-repair] Supabase upsert FAILED:', error.message, error.details, error.hint);
    } else {
      console.log('[push-repair] Supabase upsert SUCCESS:', saved);
    }
  } catch (err) {
    console.error('[push-repair] EXCEPTION:', err);
  }
}

export async function toggleNotifications(userId, enabled) {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ notifications_enabled: enabled })
    .eq('user_id', userId);

  if (error) console.error('Failed to toggle notifications:', error);
  return !error;
}

export async function getNotificationStatus(userId) {
  const { data } = await supabase
    .from('push_subscriptions')
    .select('notifications_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.notifications_enabled ?? null;
}
