import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getPendingInvites, acceptInvite, declineInvite } from '../lib/partners';

export default function PendingInviteBanner({ userId, onAccepted }) {
  const [invite, setInvite] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      const invites = await getPendingInvites(userId);
      if (invites.length === 0) return;

      const inv = invites[0];
      setInvite(inv);

      const { data } = await supabase.rpc('search_users', { search_query: '' });
      const sender = (data ?? []).find((u) => u.id === inv.user1_id);

      if (sender) {
        setSenderName(sender.username ? `@${sender.username}` : sender.email);
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('id', inv.user1_id)
          .maybeSingle();
        setSenderName(profile?.username ? `@${profile.username}` : profile?.email ?? 'Someone');
      }
    }
    load();
  }, [userId]);

  if (!invite) return null;

  const handleAccept = async () => {
    setProcessing(true);
    const result = await acceptInvite(invite.id);
    if (!result.error) {
      setInvite(null);
      onAccepted?.();
    }
    setProcessing(false);
  };

  const handleDecline = async () => {
    setProcessing(true);
    await declineInvite(invite.id);
    setInvite(null);
    setProcessing(false);
  };

  return (
    <div className="bg-surface border border-accent/30 rounded-2xl p-4 mb-6 animate-[slideUp_0.3s_ease-out]">
      <p className="text-white text-sm font-medium mb-3">
        {senderName} wants to be your accountability partner.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={processing}
          className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-50"
        >
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={processing}
          className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-semibold text-sm disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
