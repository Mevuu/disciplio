import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children, skipHabitCheck = false }) {
  const { user, loading } = useAuth();
  const [habitCount, setHabitCount] = useState(null);

  useEffect(() => {
    if (!user || skipHabitCheck) return;

    supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setHabitCount(count ?? 0));
  }, [user, skipHabitCheck]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!skipHabitCheck && habitCount === null) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!skipHabitCheck && habitCount === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
