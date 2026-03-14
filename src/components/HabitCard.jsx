import { useState } from 'react';

export default function HabitCard({ emoji, text, completed, onToggle }) {
  const [animating, setAnimating] = useState(false);

  const handleToggle = () => {
    setAnimating(true);
    onToggle();
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl bg-surface border transition-all duration-300 ${
        completed ? 'border-l-4 border-l-accent border-border' : 'border-border'
      }`}
    >
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <span className={`flex-1 text-sm font-medium ${completed ? 'text-white' : 'text-text-secondary'}`}>
        {text}
      </span>
      <button
        onClick={handleToggle}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          completed
            ? 'bg-accent border-accent'
            : 'border-text-secondary bg-transparent'
        } ${animating ? 'scale-125' : 'scale-100'}`}
        aria-label={completed ? `Mark ${text} incomplete` : `Mark ${text} complete`}
      >
        {completed && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
