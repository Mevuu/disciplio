import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ALL_HABITS, HABIT_EMOJIS } from '../lib/constants';
import { getNotificationStatus, toggleNotifications, resetNotificationPreference } from '../lib/pushNotifications';
import RemovePartnerModal from '../components/RemovePartnerModal';
import BottomNav from '../components/BottomNav';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changingHabits, setChangingHabits] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [customHabitInput, setCustomHabitInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(null);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [partnership, setPartnership] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const allHabits = [...ALL_HABITS, ...customHabits];

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [p, h] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('habits').select('*').eq('user_id', user.id),
      ]);
      if (p.data) setProfile(p.data);
      if (h.data) setHabits(h.data);
      const notifStatus = await getNotificationStatus(user.id);
      setNotifEnabled(notifStatus);

      const { data: pData } = await supabase
        .from('partnerships')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      if (pData) {
        setPartnership(pData);
        const partnerId = pData.user1_id === user.id ? pData.user2_id : pData.user1_id;
        const { data: pp } = await supabase
          .from('profiles')
          .select('id, email, username')
          .eq('id', partnerId)
          .maybeSingle();
        if (pp) setPartnerProfile(pp);
      }

      setLoading(false);
    }
    load();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const toggleHabit = (index) => {
    setSelectedHabits((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 3) return prev;
      return [...prev, index];
    });
  };

  const addCustomHabit = () => {
    const trimmed = customHabitInput.trim();
    if (!trimmed || customHabits.length >= 3) return;
    const duplicate = allHabits.some(
      (h) => h.text.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) return;
    setCustomHabits((prev) => [...prev, { emoji: selectedEmoji || '⭐', text: trimmed }]);
    setCustomHabitInput('');
    setSelectedEmoji('');
  };

  const handleConfirmNewHabits = async () => {
    setSaving(true);
    try {
      await supabase.from('habits').delete().eq('user_id', user.id);

      const habitRows = selectedHabits.map((idx) => ({
        user_id: user.id,
        habit_emoji: allHabits[idx].emoji,
        habit_text: allHabits[idx].text,
      }));
      await supabase.from('habits').insert(habitRows);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  if (changingHabits) {
    return (
      <div className="min-h-screen bg-bg flex flex-col px-6 py-12">
        <div className="max-w-sm mx-auto w-full">
          <h1 className="text-2xl font-bold text-white text-center">
            Choose New Habits
          </h1>
          <p className="mt-2 text-text-secondary text-sm text-center">
            Pick exactly 3 habits to track daily.
          </p>

          <div className="mt-2 text-center">
            <span className="text-accent font-semibold text-sm">
              {selectedHabits.length} of 3 selected
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {allHabits.map((habit, idx) => {
              const isSelected = selectedHabits.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleHabit(idx)}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-surface border text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-l-4 border-l-accent border-border'
                      : 'border-border'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{habit.emoji}</span>
                  <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                    {habit.text}
                  </span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {customHabits.length < 3 && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add your own habit"
                  value={customHabitInput}
                  onChange={(e) => setCustomHabitInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomHabit()}
                  maxLength={60}
                  className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-white text-sm placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={addCustomHabit}
                  disabled={!customHabitInput.trim()}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-accent text-white text-2xl font-bold flex-shrink-0 transition-opacity disabled:opacity-30"
                >
                  +
                </button>
              </div>
              {customHabitInput.trim() && (
                <div className="mt-3 bg-surface border border-border rounded-2xl p-3">
                  <p className="text-text-secondary text-xs font-medium mb-2">
                    Pick an emoji {selectedEmoji && <span className="text-white">— {selectedEmoji}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedEmoji(emoji === selectedEmoji ? '' : emoji)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl transition-all ${
                          selectedEmoji === emoji
                            ? 'bg-accent/20 ring-2 ring-accent scale-110'
                            : 'bg-bg hover:bg-border'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleConfirmNewHabits}
            disabled={selectedHabits.length !== 3 || saving}
            className={`w-full mt-8 py-4 rounded-2xl font-semibold text-base transition-all ${
              selectedHabits.length === 3
                ? 'bg-accent text-white active:scale-[0.98]'
                : 'bg-border text-nav-inactive cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : 'Confirm Habits'}
          </button>

          <button
            onClick={() => setChangingHabits(false)}
            className="w-full mt-3 py-3 text-text-secondary text-sm font-medium transition-colors active:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-lg mx-auto px-5 pt-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>

        {/* Current Habits */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Your Habits
          </p>
          <div className="bg-surface border border-border rounded-2xl divide-y divide-border">
            {habits.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-xl">{h.habit_emoji}</span>
                <span className="flex-1 text-white text-sm font-medium">{h.habit_text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setSelectedHabits([]);
              setCustomHabits([]);
              setCustomHabitInput('');
              setSelectedEmoji('');
              setChangingHabits(true);
            }}
            className="w-full mt-4 py-3 rounded-2xl border border-accent text-accent font-semibold text-sm transition-transform active:scale-[0.98]"
          >
            Change Habits
          </button>
        </div>

        {/* Accountability Partner */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Accountability Partner
          </p>
          {partnership && partnerProfile ? (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-semibold">
                  {partnerProfile.username ? `@${partnerProfile.username}` : partnerProfile.email}
                </span>
                {partnership.partner_streak > 0 && (
                  <span className="text-text-secondary text-xs">🔥 {partnership.partner_streak} day streak</span>
                )}
              </div>
              <p className="text-text-secondary text-xs mb-4">{partnerProfile.email}</p>
              <button
                onClick={() => setShowRemoveModal(true)}
                className="w-full py-3 rounded-2xl border border-red-500/40 text-red-400 font-semibold text-sm transition-transform active:scale-[0.98]"
              >
                Remove Partner
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-text-secondary text-sm">No partner connected</p>
            </div>
          )}
        </div>

        {/* Streak Freeze */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Streak Freeze
          </p>
          <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
            <span className="text-3xl">❄️</span>
            <div>
              <p className="text-white text-sm font-semibold">
                {profile?.streak_freeze_count ?? 0} freezes remaining
              </p>
              <p className="text-text-secondary text-xs mt-1">
                A freeze protects your streak for one missed day
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifEnabled !== null && (
          <div className="mt-8">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
              Notifications
            </p>
            <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">Push Notifications</p>
                <p className="text-text-secondary text-xs mt-1">
                  Daily reminders &amp; partner nudges
                </p>
              </div>
              <button
                disabled={togglingNotif}
                onClick={async () => {
                  setTogglingNotif(true);
                  const newVal = !notifEnabled;
                  const ok = await toggleNotifications(user.id, newVal);
                  if (ok) setNotifEnabled(newVal);
                  setTogglingNotif(false);
                }}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  notifEnabled ? 'bg-accent' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                    notifEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Account */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Account
          </p>
          <div className="bg-surface border border-border rounded-2xl divide-y divide-border">
            <div className="px-5 py-4 flex justify-between">
              <span className="text-text-secondary text-sm">Email</span>
              <span className="text-white text-sm">{user?.email}</span>
            </div>
            <div className="px-5 py-4 flex justify-between">
              <span className="text-text-secondary text-sm">Member since</span>
              <span className="text-white text-sm">{memberSince}</span>
            </div>
            <div className="px-5 py-4 flex justify-between">
              <span className="text-text-secondary text-sm">Subscription</span>
              <span className="text-white text-sm capitalize">
                {profile?.subscription_status ?? 'Free'}
              </span>
            </div>
          </div>
        </div>

        {/* Debug / Testing */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Testing
          </p>
          <button
            onClick={() => {
              resetNotificationPreference();
              alert('Notification preference reset. The permission modal will appear on next app load.');
            }}
            className="w-full py-3 rounded-2xl border border-border text-text-secondary font-semibold text-sm transition-transform active:scale-[0.98]"
          >
            Reset Notification Permission
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-10 py-4 rounded-2xl border border-red-500/40 text-red-400 font-semibold text-base transition-transform active:scale-[0.98]"
        >
          Log Out
        </button>
      </div>

      <BottomNav />

      {showRemoveModal && partnership && (
        <RemovePartnerModal
          partnershipId={partnership.id}
          onClose={() => setShowRemoveModal(false)}
          onRemoved={() => {
            setPartnership(null);
            setPartnerProfile(null);
          }}
        />
      )}
    </div>
  );
}
