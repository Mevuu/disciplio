import { useState } from 'react';
import { searchUsers, sendPartnerInvite, createInviteLink } from '../lib/partners';

export default function InvitePartnerModal({ userId, onClose, onInviteSent }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [noResults, setNoResults] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError('');
    setNoResults(false);

    const data = await searchUsers(query.trim());
    setResults(data);
    setNoResults(data.length === 0);
    setSearching(false);
  };

  const handleSendInvite = async (recipientId) => {
    setSending(true);
    setError('');
    const result = await sendPartnerInvite(userId, recipientId);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Invite sent!');
      onInviteSent?.();
      setTimeout(() => onClose(), 1500);
    }
    setSending(false);
  };

  const handleInviteViaLink = async () => {
    setGeneratingLink(true);
    setError('');
    const result = await createInviteLink(userId);
    if (result.error) {
      setError(result.error);
    } else {
      setInviteLink(result.link);
      try {
        await navigator.clipboard.writeText(result.link);
        setCopied(true);
      } catch {
        /* clipboard not available */
      }
    }
    setGeneratingLink(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-8">
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 animate-[slideUp_0.3s_ease-out] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-semibold">Find a Partner</h2>
          <button onClick={onClose} className="text-text-secondary text-2xl leading-none">&times;</button>
        </div>

        {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}
        {success && <p className="mb-3 text-accent text-sm">{success}</p>}

        {/* Section 1: Search */}
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
          Search by email or username
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Email or username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searching || query.trim().length < 2}
            className="px-4 py-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-30"
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {results.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-bg border border-border rounded-xl px-4 py-3">
                <div>
                  {u.username && <p className="text-white text-sm font-medium">@{u.username}</p>}
                  <p className="text-text-secondary text-xs">{u.email}</p>
                </div>
                <button
                  onClick={() => handleSendInvite(u.id)}
                  disabled={sending}
                  className="px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-50"
                >
                  {sending ? '…' : 'Send Invite'}
                </button>
              </div>
            ))}
          </div>
        )}

        {noResults && (
          <p className="mt-3 text-text-secondary text-sm text-center">No user found with that email or username</p>
        )}

        {/* Divider */}
        <div className="my-5 border-t border-border" />

        {/* Section 2: Invite via link */}
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
          Or invite via link
        </p>

        {!inviteLink ? (
          <button
            onClick={handleInviteViaLink}
            disabled={generatingLink}
            className="w-full py-3 rounded-2xl border border-accent text-accent font-semibold text-sm transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {generatingLink ? 'Generating…' : 'Generate Invite Link 🔗'}
          </button>
        ) : (
          <div>
            <p className="text-accent text-sm font-semibold mb-2">
              {copied ? 'Invite link copied to clipboard!' : 'Share this link with your friend:'}
            </p>
            <div className="bg-bg border border-border rounded-xl px-3 py-2 flex items-center gap-2">
              <p className="flex-1 text-white text-xs font-mono break-all">{inviteLink}</p>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteLink);
                  setCopied(true);
                }}
                className="text-accent text-xs font-semibold flex-shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
