import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import HabitCard from '../components/HabitCard';
import CalendarGrid from '../components/CalendarGrid';
import BottomNav from '../components/BottomNav';
import NotificationModal from '../components/NotificationModal';
import PartnerCard from '../components/PartnerCard';
import PendingInviteBanner from '../components/PendingInviteBanner';
import InvitePartnerModal from '../components/InvitePartnerModal';
import { MONTH_NAMES } from '../lib/constants';
import {
  getStoredInviteCode,
  clearStoredInviteCode,
  acceptInviteCode,
  maybeIncrementPartnerStreak,
} from '../lib/partners';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [completedDays, setCompletedDays] = useState([]);
  const [allDone, setAllDone] = useState(false);
  const [partnership, setPartnership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const fetchPartnership = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('partnerships')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .maybeSingle();
    setPartnership(data);
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const today = todayStr();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [profileRes, habitsRes, checkinRes, monthCheckinsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('checkins').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase
        .from('checkins')
        .select('date, fully_completed')
        .eq('user_id', user.id)
        .eq('fully_completed', true)
        .gte('date', monthStart),
    ]);

    let profileData = profileRes.data;
    if (!profileData && !profileRes.error) {
      const { data: created } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          streak_count: 0,
          streak_freeze_count: 2,
          subscription_status: 'free',
          habit_slots_unlocked: 3,
        })
        .select()
        .single();
      profileData = created;
    }

    if (profileData) setProfile(profileData);
    if (habitsRes.data?.length > 0) setHabits(habitsRes.data);
    if (checkinRes.data?.habits_completed) setCompletedIds(checkinRes.data.habits_completed);

    if (monthCheckinsRes.data) {
      const days = monthCheckinsRes.data.map((c) => new Date(c.date + 'T00:00:00').getDate());
      setCompletedDays(days);
    }

    if (profileData) {
      const validated = await validateStreakOnLoad(profileData, todayStr());
      if (validated !== profileData) setProfile(validated);
    }

    await fetchPartnership();

    // Process pending invite code from localStorage (from invite link flow)
    const inviteCode = getStoredInviteCode();
    if (inviteCode) {
      await acceptInviteCode(inviteCode);
      clearStoredInviteCode();
      await fetchPartnership();
    }

    setLoading(false);
  }, [user, fetchPartnership]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (habits.length > 0 && completedIds.length === habits.length) {
      setAllDone(true);
    } else {
      setAllDone(false);
    }
  }, [completedIds, habits]);

  const toggleHabit = async (habitId) => {
    const newCompleted = completedIds.includes(habitId)
      ? completedIds.filter((id) => id !== habitId)
      : [...completedIds, habitId];

    setCompletedIds(newCompleted);

    const fullyCompleted = newCompleted.length === habits.length;
    const today = todayStr();

    await supabase.from('checkins').upsert(
      {
        user_id: user.id,
        date: today,
        habits_completed: newCompleted,
        fully_completed: fullyCompleted,
      },
      { onConflict: 'user_id,date' }
    );
    if (fullyCompleted) {
      if (!completedDays.includes(now.getDate())) {
        setCompletedDays((prev) => [...prev, now.getDate()]);
      }

      const alreadyCounted = profile?.last_checkin_date === today;
      if (!alreadyCounted) {
        const updatedProfile = await computeAndSaveStreak(today);
        if (updatedProfile) setProfile(updatedProfile);
      }

      // Check partner streak
      if (partnership) {
        const newStreak = await maybeIncrementPartnerStreak(partnership.id, today);
        if (newStreak !== null && newStreak !== partnership.partner_streak) {
          setPartnership((prev) => prev ? { ...prev, partner_streak: newStreak } : prev);
        }
      }
    }
  };

  async function computeAndSaveStreak(today) {
    const { data: freshProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchErr) return null;

    const lastDate = freshProfile?.last_checkin_date ?? null;
    const currentStreak = freshProfile?.streak_count ?? 0;
    const currentFreezes = freshProfile?.streak_freeze_count ?? 2;
    let newStreak;
    let freezesUsed = 0;

    if (!lastDate) {
      newStreak = 1;
    } else {
      const last = new Date(lastDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diffDays = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return freshProfile;
      else if (diffDays === 1) newStreak = currentStreak + 1;
      else {
        const missedDays = diffDays - 1;
        if (missedDays <= currentFreezes) {
          freezesUsed = missedDays;
          newStreak = currentStreak + 1;
        } else {
          newStreak = 1;
        }
      }
    }

    const profileData = {
      id: user.id,
      email: user.email,
      streak_count: newStreak,
      last_checkin_date: today,
      streak_freeze_count: freezesUsed > 0 ? currentFreezes - freezesUsed : currentFreezes,
      subscription_status: freshProfile?.subscription_status ?? 'free',
      habit_slots_unlocked: freshProfile?.habit_slots_unlocked ?? 3,
    };

    const { data: savedProfile, error: saveErr } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (saveErr) {
      return { ...freshProfile, streak_count: newStreak, last_checkin_date: today };
    }

    return savedProfile;
  }

  async function validateStreakOnLoad(currentProfile, today) {
    const lastDate = currentProfile?.last_checkin_date;
    if (!lastDate || currentProfile.streak_count === 0) return currentProfile;

    const last = new Date(lastDate + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const diffDays = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return currentProfile;

    const missedDays = diffDays - 1;
    const availableFreezes = currentProfile?.streak_freeze_count ?? 0;
    if (missedDays <= availableFreezes) return currentProfile;

    const { data: saved, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, streak_count: 0 })
      .select()
      .single();

    if (error) return currentProfile;
    return saved ?? { ...currentProfile, streak_count: 0 };
  }

  const handlePartnerStreakUpdate = useCallback(async () => {
    if (!partnership) return;
    const today = todayStr();
    const newStreak = await maybeIncrementPartnerStreak(partnership.id, today);
    if (newStreak !== null && newStreak !== partnership.partner_streak) {
      setPartnership((prev) => prev ? { ...prev, partner_streak: newStreak } : prev);
    }
  }, [partnership]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const streak = profile?.streak_count ?? 0;
  const slotsUnlocked = profile?.habit_slots_unlocked ?? 3;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-lg mx-auto px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/disciplio-logo-dark.svg" alt="Disciplio" className="h-8 w-auto max-w-[160px]" />
          </div>
          <a href="/settings" className="text-text-secondary hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Date */}
        <p className="mt-1 text-text-secondary text-sm">
          {dayOfWeek}, {dateStr}
        </p>

        {/* Pending partner invite banner */}
        <div className="mt-6">
          <PendingInviteBanner userId={user.id} onAccepted={fetchPartnership} />
        </div>

        {/* Streak */}
        <div className="mt-4 text-center">
          <p className="text-6xl font-extrabold text-white">
            🔥 {streak}
          </p>
          <p className="mt-2 text-text-secondary text-sm">
            day streak — keep it going
          </p>
        </div>

        {/* Today's Habits */}
        <div className="mt-10">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Today's Habits
          </p>
          {habits.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm">No habits found.</p>
              <p className="text-text-secondary text-xs mt-1">
                Complete signup to choose your 3 daily habits.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {habits.map((h) => (
                <HabitCard
                  key={h.id}
                  emoji={h.habit_emoji}
                  text={h.habit_text}
                  completed={completedIds.includes(h.id)}
                  onToggle={() => toggleHabit(h.id)}
                />
              ))}
            </div>
          )}
          {allDone && (
            <div className="mt-4 text-center">
              <p className="text-accent text-sm font-semibold animate-pulse">
                All done today. Streak secured. 🔥
              </p>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="mt-10">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            {MONTH_NAMES[now.getMonth()]}
          </p>
          <div className="bg-surface border border-border rounded-2xl p-4">
            <CalendarGrid
              year={now.getFullYear()}
              month={now.getMonth()}
              completedDays={completedDays}
            />
          </div>
        </div>

        {/* Partner */}
        <div className="mt-10" id="partner-section">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Accountability Partner
          </p>
          {partnership ? (
            <PartnerCard
              userId={user.id}
              partnership={partnership}
              onStreakUpdate={handlePartnerStreakUpdate}
            />
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-text-secondary text-sm">No partner yet</p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="mt-4 w-full py-3 rounded-2xl border border-accent text-accent font-semibold text-sm transition-transform active:scale-[0.98]"
              >
                Invite a Partner
              </button>
            </div>
          )}
        </div>

        {/* Unlock Progress */}
        <div className="mt-10 mb-6">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-semibold">Habit Slots</span>
              <span className="text-text-secondary text-xs">{slotsUnlocked} of 5 unlocked</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${(slotsUnlocked / 5) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-text-secondary text-xs">
              Reach a 7-day streak to unlock your {slotsUnlocked + 1 > 5 ? 'max' : `${ordinal(slotsUnlocked + 1)}`} habit slot
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
      <NotificationModal />

      {showInviteModal && (
        <InvitePartnerModal
          userId={user.id}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={() => fetchPartnership()}
        />
      )}
    </div>
  );
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
