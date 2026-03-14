import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-white mb-8">Log In</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-text-secondary text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="text-white font-medium">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
