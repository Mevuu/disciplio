import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [p, h] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('habits').select('*').eq('user_id', user.id),
      ]);
      if (p.data) setProfile(p.data);
      if (h.data) setHabits(h.data);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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
          <p className="mt-3 text-text-secondary text-xs">
            You can swap one habit per month. Feature coming soon.
          </p>
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-10 py-4 rounded-2xl border border-red-500/40 text-red-400 font-semibold text-base transition-transform active:scale-[0.98]"
        >
          Log Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
