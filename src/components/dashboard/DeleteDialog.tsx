"use client";

import { useState } from "react";

interface DeleteDialogProps {
  videoTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteDialog({ videoTitle, onConfirm, onCancel }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[var(--surface-container)] rounded-xl p-6 max-w-sm w-full border border-[var(--outline-variant)]/20 shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(255,180,171,0.15)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-manrope)] font-bold text-[var(--on-surface)]">
              Delete project
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)]">
              This action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--on-surface-variant)] mb-6">
          Are you sure you want to delete <strong className="text-[var(--on-surface)]">{videoTitle}</strong>? The video and all subtitles will be permanently removed.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:bg-[var(--surface-bright)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--error)] text-white hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
