import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password);
      // After signup, onAuthStateChange sets the user in AuthContext.
      // PublicRoute then redirects to /dashboard, and ProtectedRoute
      // sees zero habits and redirects to /onboarding automatically.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-white mb-8">Create Account</h1>

      <form onSubmit={handleCreateAccount} className="w-full max-w-sm">
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-text-secondary text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-white font-medium">
          Log In
        </Link>
      </p>
    </div>
  );
}
