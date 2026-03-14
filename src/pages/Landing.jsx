import { Link } from 'react-router-dom';

const features = [
  { emoji: '🍳', title: 'Eat', desc: 'Fuel your body with real food' },
  { emoji: '🏃', title: 'Move', desc: 'Get active every single day' },
  { emoji: '💻', title: 'Focus', desc: 'Do the deep work that matters' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-16">
      <img src="/icons/disciplio-logo-dark.svg" alt="Disciplio" className="w-[120px]" />

      <div className="mt-16 text-center max-w-sm">
        <h2 className="text-2xl font-bold text-white leading-tight">
          Build Real Discipline.
          <br />
          One Day at a Time.
        </h2>
        <p className="mt-4 text-text-secondary text-sm leading-relaxed">
          Track your three daily habits. Stay accountable with a partner. Build streaks that last.
        </p>
      </div>

      <div className="mt-10 w-full max-w-sm flex flex-col gap-3">
        <Link
          to="/signup"
          className="w-full py-4 rounded-2xl bg-accent text-white text-center font-semibold text-base transition-transform active:scale-[0.98]"
        >
          Start for Free
        </Link>
        <Link
          to="/login"
          className="w-full py-4 rounded-2xl border border-white/20 text-white text-center font-semibold text-base transition-transform active:scale-[0.98]"
        >
          Log In
        </Link>
      </div>

      <div className="mt-16 w-full max-w-sm grid grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col items-center text-center gap-2">
            <span className="text-3xl">{f.emoji}</span>
            <span className="text-white text-sm font-semibold">{f.title}</span>
            <span className="text-text-secondary text-xs leading-snug">{f.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
