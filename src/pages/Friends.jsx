import BottomNav from '../components/BottomNav';

export default function Friends() {
  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-lg mx-auto px-5 pt-6">
        <h1 className="text-2xl font-bold text-white">Friends</h1>
        <p className="mt-2 text-text-secondary text-sm">
          Accountability partners and friends coming soon.
        </p>

        <div className="mt-8 bg-surface border border-border rounded-2xl p-8 text-center">
          <span className="text-4xl">👥</span>
          <p className="mt-4 text-white font-semibold">No friends yet</p>
          <p className="mt-2 text-text-secondary text-sm">
            Invite a friend to stay accountable together.
          </p>
          <button className="mt-6 w-full py-3 rounded-2xl border border-accent text-accent font-semibold text-sm transition-transform active:scale-[0.98]">
            Invite a Friend
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
