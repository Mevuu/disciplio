import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getPartnerData } from '../lib/partners';
import NudgeButton from './NudgeButton';

export default function PartnerCard({ userId, partnership, onStreakUpdate }) {
  const [partner, setPartner] = useState(null);
  const [partnerHabits, setPartnerHabits] = useState([]);
  const [completedHabitIds, setCompletedHabitIds] = useState([]);
  const [partnerDone, setPartnerDone] = useState(false);

  const partnerId =
    partnership.user1_id === userId ? partnership.user2_id : partnership.user1_id;

  useEffect(() => {
    async function load() {
      const data = await getPartnerData(userId, partnership);
      setPartner(data.profile);
      setPartnerHabits(data.habits);
      setCompletedHabitIds(data.checkin?.habits_completed ?? []);
      setPartnerDone(data.checkin?.fully_completed ?? false);
    }
    load();
  }, [userId, partnership]);

  // Real-time subscription for partner's checkins
  useEffect(() => {
    const channel = supabase
      .channel(`partner-checkin-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `user_id=eq.${partnerId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          setCompletedHabitIds(row.habits_completed ?? []);
          setPartnerDone(row.fully_completed ?? false);

          if (row.fully_completed) {
            onStreakUpdate?.();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [partnerId, onStreakUpdate]);

  const partnerName = partner?.username ? `@${partner.username}` : partner?.email ?? '…';
  const partnerStreak = partnership.partner_streak ?? 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white text-sm font-semibold">{partnerName}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${partnerDone ? 'bg-accent/20 text-accent' : 'bg-border text-text-secondary'}`}>
          {partnerDone ? 'All done ✅' : 'Not yet'}
        </span>
      </div>

      {partnerStreak > 0 && (
        <p className="text-text-secondary text-xs mb-3">🔥 {partnerStreak} day partner streak</p>
      )}

      {partnerHabits.length > 0 && (
        <div className="flex gap-3 mb-4">
          {partnerHabits.map((h) => {
            const done = completedHabitIds.includes(h.id);
            return (
              <div
                key={h.id}
                className={`flex items-center justify-center w-10 h-10 rounded-xl text-lg transition-colors ${
                  done ? 'bg-accent/20' : 'bg-bg'
                }`}
                title={h.habit_text}
              >
                <span className={done ? '' : 'opacity-30'}>{h.habit_emoji}</span>
              </div>
            );
          })}
        </div>
      )}

      <NudgeButton
        partnershipId={partnership.id}
        lastNudgeSent={partnership.last_nudge_sent}
      />
    </div>
  );
}
