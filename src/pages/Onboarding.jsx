import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ALL_HABITS } from '../lib/constants';

export default function Onboarding() {
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleHabit = (index) => {
    setSelectedHabits((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 3) return prev;
      return [...prev, index];
    });
  };

  const handleConfirmHabits = async () => {
    setLoading(true);
    setError('');
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        streak_count: 0,
        streak_freeze_count: 2,
        subscription_status: 'free',
        habit_slots_unlocked: 3,
      });

      const habitRows = selectedHabits.map((idx) => ({
        user_id: user.id,
        habit_emoji: ALL_HABITS[idx].emoji,
        habit_text: ALL_HABITS[idx].text,
      }));

      await supabase.from('habits').insert(habitRows);

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-12">
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-white text-center">
          What do you struggle with?
        </h1>
        <p className="mt-2 text-text-secondary text-sm text-center">
          Choose exactly 3 habits to track daily.
        </p>

        <div className="mt-2 text-center">
          <span className="text-accent font-semibold text-sm">
            {selectedHabits.length} of 3 selected
          </span>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {ALL_HABITS.map((habit, idx) => {
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

        <button
          onClick={handleConfirmHabits}
          disabled={selectedHabits.length !== 3 || loading}
          className={`w-full mt-8 py-4 rounded-2xl font-semibold text-base transition-all ${
            selectedHabits.length === 3
              ? 'bg-accent text-white active:scale-[0.98]'
              : 'bg-border text-nav-inactive cursor-not-allowed'
          }`}
        >
          {loading ? 'Saving…' : 'Confirm Habits'}
        </button>
      </div>
    </div>
  );
}
