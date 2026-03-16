import { useState } from 'react';
import { removePartnership } from '../lib/partners';

export default function RemovePartnerModal({ partnershipId, onClose, onRemoved }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    const result = await removePartnership(partnershipId);
    if (!result.error) {
      onRemoved?.();
    }
    setRemoving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6">
        <h2 className="text-white text-lg font-semibold text-center">Remove Partner?</h2>
        <p className="mt-2 text-text-secondary text-sm text-center">
          Are you sure? You will both lose the partner streak.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleRemove}
            disabled={removing}
            className="w-full py-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {removing ? 'Removing…' : 'Remove Partner'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl border border-white/20 text-white font-semibold text-base transition-transform active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
