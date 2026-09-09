import React from 'react';
import { Megaphone } from 'lucide-react';

export const WorkerAnnouncementBanner = ({ announcement }) => {
  if (!announcement || !announcement.isActive || !announcement.message?.trim()) {
    return null;
  }

  return (
    <div
      id="worker-announcement-banner"
      className="glass-panel rounded-2xl p-3.5 sm:p-4 border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md shadow-sm transition-all flex items-center gap-3 sm:gap-3.5"
    >
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-600 dark:text-purple-400 shrink-0 shadow-inner">
        <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] leading-relaxed break-words">
          {announcement.message}
        </p>
      </div>
    </div>
  );
};
