import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  shouldShowNotificationModal,
  subscribeToPush,
  snoozeModal,
  repairMissingSubscription,
} from '../lib/pushNotifications';

export default function NotificationModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (shouldShowNotificationModal()) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }

    repairMissingSubscription(user.id);
  }, [user]);

  if (!visible) return null;

  const handleEnable = async () => {
    setSubscribing(true);
    await subscribeToPush(user.id);
    setVisible(false);
  };

  const handleLater = () => {
    snoozeModal();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-8">
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 animate-[slideUp_0.3s_ease-out]">
        <div className="text-center">
          <span className="text-4xl">🔔</span>
          <p className="mt-4 text-white text-lg font-semibold leading-snug">
            Stay on track — get daily reminders to keep your streak alive 🔥
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleEnable}
            disabled={subscribing}
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {subscribing ? 'Enabling…' : 'Enable Notifications'}
          </button>
          <button
            onClick={handleLater}
            className="w-full py-4 rounded-2xl border border-white/20 text-white font-semibold text-base transition-transform active:scale-[0.98]"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
