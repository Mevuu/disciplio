import { supabase } from './supabase';

const INVITE_CODE_KEY = 'disciplio-invite-code';

export async function searchUsers(query) {
  const { data, error } = await supabase.rpc('search_users', { search_query: query });
  if (error) console.error('[partners] search error:', error);
  return data ?? [];
}

export async function sendPartnerInvite(senderId, recipientId) {
  const { data: existing } = await supabase
    .from('partnerships')
    .select('id')
    .or(`user1_id.eq.${senderId},user2_id.eq.${senderId}`)
    .in('status', ['active', 'pending'])
    .maybeSingle();

  if (existing) return { error: 'You already have an active or pending partnership' };

  const { error } = await supabase.from('partnerships').insert({
    user1_id: senderId,
    user2_id: recipientId,
    status: 'pending',
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function getPendingInvites(userId) {
  const { data, error } = await supabase
    .from('partnerships')
    .select('*')
    .eq('user2_id', userId)
    .eq('status', 'pending');

  if (error) console.error('[partners] pending invites error:', error);
  return data ?? [];
}

export async function getSenderProfile(senderId) {
  const results = await supabase.rpc('search_users', { search_query: '' });
  const match = (results.data ?? []).find((u) => u.id === senderId);
  if (match) return match;

  const { data } = await supabase
    .from('profiles')
    .select('id, email, username')
    .eq('id', senderId)
    .maybeSingle();
  return data;
}

export async function acceptInvite(partnershipId) {
  const { error } = await supabase
    .from('partnerships')
    .update({ status: 'active' })
    .eq('id', partnershipId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function declineInvite(partnershipId) {
  const { error } = await supabase
    .from('partnerships')
    .delete()
    .eq('id', partnershipId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function removePartnership(partnershipId) {
  const { error } = await supabase
    .from('partnerships')
    .delete()
    .eq('id', partnershipId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function createInviteLink(senderId) {
  const code = crypto.randomUUID().slice(0, 8);
  const { error } = await supabase.from('partner_invites').insert({
    sender_id: senderId,
    invite_code: code,
  });

  if (error) return { error: error.message };

  const link = `${window.location.origin}/invite/${code}`;
  return { ok: true, code, link };
}

export async function getInviteInfo(code) {
  const { data, error } = await supabase.rpc('get_invite_info', { code });
  if (error) return { error: error.message };
  return data;
}

export async function acceptInviteCode(code) {
  const { data, error } = await supabase.rpc('accept_partner_invite', { code });
  if (error) return { error: error.message };
  return data;
}

export function storeInviteCode(code) {
  localStorage.setItem(INVITE_CODE_KEY, code);
}

export function getStoredInviteCode() {
  return localStorage.getItem(INVITE_CODE_KEY);
}

export function clearStoredInviteCode() {
  localStorage.removeItem(INVITE_CODE_KEY);
}

export async function isUsernameAvailable(username) {
  const { data, error } = await supabase.rpc('is_username_available', {
    desired_username: username,
  });
  if (error) return false;
  return data === true;
}

export async function setUsername(userId, username) {
  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function getPartnerData(userId, partnership) {
  const partnerId =
    partnership.user1_id === userId ? partnership.user2_id : partnership.user1_id;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [profileRes, habitsRes, checkinRes] = await Promise.all([
    supabase.from('profiles').select('id, email, username').eq('id', partnerId).maybeSingle(),
    supabase.from('habits').select('*').eq('user_id', partnerId),
    supabase.from('checkins').select('*').eq('user_id', partnerId).eq('date', todayStr).maybeSingle(),
  ]);

  return {
    partnerId,
    profile: profileRes.data,
    habits: habitsRes.data ?? [],
    checkin: checkinRes.data,
  };
}

export async function maybeIncrementPartnerStreak(partnershipId, dateStr) {
  const { data, error } = await supabase.rpc('maybe_increment_partner_streak', {
    p_partnership_id: partnershipId,
    p_check_date: dateStr,
  });
  if (error) {
    console.error('[partners] streak increment error:', error);
    return null;
  }
  return data;
}
