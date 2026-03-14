import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import HabitCard from '../components/HabitCard';
import CalendarGrid from '../components/CalendarGrid';
import BottomNav from '../components/BottomNav';
import { MONTH_NAMES } from '../lib/constants';

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
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

    console.log('[fetchData] profileRes:', profileRes.data, profileRes.error);
    console.log('[fetchData] habitsRes:', habitsRes.data, habitsRes.error);
    console.log('[fetchData] checkinRes:', checkinRes.data, checkinRes.error);

    // If profile row is missing (signup upsert may have failed), create it now
    let profileData = profileRes.data;
    if (!profileData && !profileRes.error) {
      console.warn('[fetchData] No profile row found — creating one now');
      const { data: created, error: createErr } = await supabase
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
      console.log('[fetchData] Profile create result:', created, createErr);
      profileData = created;
    }

    if (profileData) setProfile(profileData);

    if (habitsRes.data && habitsRes.data.length > 0) {
      setHabits(habitsRes.data);
    } else if (!habitsRes.error) {
      console.warn('[fetchData] No habits found for user:', user.id);
    }

    if (checkinRes.data?.habits_completed) {
      setCompletedIds(checkinRes.data.habits_completed);
    }

    if (monthCheckinsRes.data) {
      const days = monthCheckinsRes.data.map((c) => new Date(c.date + 'T00:00:00').getDate());
      setCompletedDays(days);
    }

    // Validate streak on load: if the user missed days and has no freezes to
    // cover the gap, reset the streak now so the counter is accurate.
    if (profileData) {
      const validated = await validateStreakOnLoad(profileData, todayStr());
      if (validated !== profileData) setProfile(validated);
    }

    setLoading(false);
  }, [user]);

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

    console.log('[toggleHabit] habitId:', habitId);
    console.log('[toggleHabit] newCompleted:', newCompleted, '| habits.length:', habits.length, '| fullyCompleted:', fullyCompleted);

    const checkinResult = await supabase.from('checkins').upsert(
      {
        user_id: user.id,
        date: today,
        habits_completed: newCompleted,
        fully_completed: fullyCompleted,
      },
      { onConflict: 'user_id,date' }
    );

    console.log('[toggleHabit] checkin upsert result:', checkinResult.error ? 'ERROR: ' + checkinResult.error.message : 'OK');

    if (fullyCompleted) {
      if (!completedDays.includes(now.getDate())) {
        setCompletedDays((prev) => [...prev, now.getDate()]);
      }

      console.log('[toggleHabit] All habits done! Current profile:', profile);
      console.log('[toggleHabit] profile.last_checkin_date:', profile?.last_checkin_date, '| today:', today);

      const alreadyCounted = profile?.last_checkin_date === today;
      console.log('[toggleHabit] Already counted today?', alreadyCounted);

      if (!alreadyCounted) {
        const updatedProfile = await computeAndSaveStreak(today);
        if (updatedProfile) {
          console.log('[toggleHabit] Setting profile with new streak:', updatedProfile.streak_count);
          setProfile(updatedProfile);
        }
      }
    }
  };

  async function computeAndSaveStreak(today) {
    // Re-read the profile directly from DB to avoid stale closure issues
    const { data: freshProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    console.log('[computeStreak] Fresh profile from DB:', freshProfile, '| fetchErr:', fetchErr);

    const lastDate = freshProfile?.last_checkin_date ?? null;
    const currentStreak = freshProfile?.streak_count ?? 0;
    const currentFreezes = freshProfile?.streak_freeze_count ?? 2;
    let newStreak;
    let freezesUsed = 0;

    if (!lastDate) {
      newStreak = 1;
      console.log('[computeStreak] No last_checkin_date → first completion, streak = 1');
    } else {
      const last = new Date(lastDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diffDays = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));
      console.log('[computeStreak] lastDate:', lastDate, '| diffDays:', diffDays);

      if (diffDays <= 0) {
        console.log('[computeStreak] diffDays <= 0, already counted today');
        return freshProfile;
      } else if (diffDays === 1) {
        newStreak = currentStreak + 1;
        console.log('[computeStreak] Consecutive day, streak:', currentStreak, '→', newStreak);
      } else {
        const missedDays = diffDays - 1;
        if (missedDays <= currentFreezes) {
          freezesUsed = missedDays;
          newStreak = currentStreak + 1;
          console.log('[computeStreak] Using', freezesUsed, 'freezes, streak:', currentStreak, '→', newStreak);
        } else {
          newStreak = 1;
          console.log('[computeStreak] Streak broken (missed', missedDays, 'days, only', currentFreezes, 'freezes), reset to 1');
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

    console.log('[computeStreak] Upserting profile:', profileData);

    const { data: savedProfile, error: saveErr } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    console.log('[computeStreak] Upsert result — data:', savedProfile, '| error:', saveErr);

    if (saveErr) {
      console.error('[computeStreak] PROFILE UPSERT FAILED:', saveErr.message);
      // Even if DB fails, return a local object so the UI updates immediately
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

    // Streak is broken — reset via upsert to handle missing rows
    const { data: saved, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, streak_count: 0 })
      .select()
      .single();

    if (error) {
      console.error('[validateStreak] Reset error:', error);
      return currentProfile;
    }

    return saved ?? { ...currentProfile, streak_count: 0 };
  }

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

        {/* Streak */}
        <div className="mt-8 text-center">
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
        <div className="mt-10">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Accountability Partner
          </p>
          <div className="bg-surface border border-border rounded-2xl p-5 text-center">
            <p className="text-text-secondary text-sm">No partner yet</p>
            <button className="mt-4 w-full py-3 rounded-2xl border border-accent text-accent font-semibold text-sm transition-transform active:scale-[0.98]">
              Invite a Partner
            </button>
          </div>
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
    </div>
  );
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
