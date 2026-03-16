import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInviteInfo, storeInviteCode, acceptInviteCode, clearStoredInviteCode } from '../lib/partners';

export default function InviteLanding() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getInviteInfo(code);
      setInvite(data);
      setLoading(false);
    }
    load();
  }, [code]);

  const handleAcceptLoggedIn = async () => {
    setAccepting(true);
    const result = await acceptInviteCode(code);
    if (result.error) {
      setError(result.error);
      setAccepting(false);
    } else {
      clearStoredInviteCode();
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSignUp = () => {
    storeInviteCode(code);
    navigate('/signup');
  };

  const handleLogin = () => {
    storeInviteCode(code);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (invite?.error || invite?.status !== 'pending') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-bold text-white">Invite Not Found</h1>
        <p className="mt-2 text-text-secondary text-sm text-center">
          This invite link may have expired or already been used.
        </p>
        <Link to="/" className="mt-6 text-accent font-semibold text-sm">Go Home</Link>
      </div>
    );
  }

  const senderDisplay = invite.sender_username
    ? `@${invite.sender_username}`
    : invite.sender_email;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <img src="/icons/disciplio-logo-dark.svg" alt="Disciplio" className="h-8 w-auto mb-10" />

      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-8 text-center">
        <span className="text-4xl">🤝</span>
        <h1 className="mt-4 text-xl font-bold text-white leading-snug">
          {senderDisplay} wants to be your accountability partner on Disciplio
        </h1>
        <p className="mt-3 text-text-secondary text-sm">
          Join them and start building real discipline together.
        </p>

        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}

        {user ? (
          <button
            onClick={handleAcceptLoggedIn}
            disabled={accepting}
            className="w-full mt-6 py-4 rounded-2xl bg-accent text-white font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {accepting ? 'Accepting…' : 'Accept Partnership'}
          </button>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleSignUp}
              className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base transition-transform active:scale-[0.98]"
            >
              Sign Up
            </button>
            <button
              onClick={handleLogin}
              className="w-full py-4 rounded-2xl border border-white/20 text-white font-semibold text-base transition-transform active:scale-[0.98]"
            >
              I Have an Account — Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
