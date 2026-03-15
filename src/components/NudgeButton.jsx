import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const COOLDOWN_MS = 2 * 60 * 60 * 1000;

export default function NudgeButton({ partnershipId, lastNudgeSent }) {
  const [cooldownEnd, setCooldownEnd] = useState(null);
  const [remaining, setRemaining] = useState('');
  const [sending, setSending] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (lastNudgeSent) {
      const end = new Date(lastNudgeSent).getTime() + COOLDOWN_MS;
      if (end > Date.now()) {
        setCooldownEnd(end);
      }
    }
  }, [lastNudgeSent]);

  useEffect(() => {
    if (!cooldownEnd) {
      setRemaining('');
      return;
    }

    function tick() {
      const diff = cooldownEnd - Date.now();
      if (diff <= 0) {
        setCooldownEnd(null);
        setRemaining('');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`Nudge again in ${h}h ${String(m).padStart(2, '0')}m`);
    }

    tick();
    intervalRef.current = setInterval(tick, 30000);
    return () => clearInterval(intervalRef.current);
  }, [cooldownEnd]);

  const handleNudge = async () => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-nudge', {
        body: { partnership_id: partnershipId },
      });
      if (error) throw error;
      setCooldownEnd(Date.now() + COOLDOWN_MS);
    } catch (err) {
      console.error('Nudge failed:', err);
    } finally {
      setSending(false);
    }
  };

  const disabled = !!cooldownEnd || sending;

  return (
    <button
      onClick={handleNudge}
      disabled={disabled}
      className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all ${
        disabled
          ? 'border border-border text-nav-inactive cursor-not-allowed'
          : 'border border-accent text-accent active:scale-[0.98]'
      }`}
    >
      {sending ? 'Sending…' : remaining || 'Nudge Partner 👋'}
    </button>
  );
}
