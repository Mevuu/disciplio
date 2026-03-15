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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC_KEY) return false;
  if (Notification.permission === 'granted') return false;
  if (Notification.permission === 'denied') return false;
  if (localStorage.getItem(MODAL_DISMISSED_KEY) === 'permanent') return false;

  const snoozeUntil = localStorage.getItem(MODAL_SNOOZE_KEY);
  if (snoozeUntil && Date.now() < parseInt(snoozeUntil, 10)) return false;

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
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        subscription: subscription.toJSON(),
        notifications_enabled: true,
      },
      { onConflict: 'user_id' }
    );

    if (error) console.error('Failed to save push subscription:', error);

    dismissModalPermanently();
    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

export async function repairMissingSubscription(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!VAPID_PUBLIC_KEY) return;
  if (Notification.permission !== 'granted') return;

  const { data } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (data) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        subscription: subscription.toJSON(),
        notifications_enabled: true,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error('Repair: failed to save subscription:', error);
    } else {
      console.log('Repair: re-registered push subscription for user', userId);
    }
  } catch (err) {
    console.error('Repair: push re-subscribe failed:', err);
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
