import React from 'react';
import { TELEGRAM_LINK } from '../../config/constants';

export const TelegramFloatingButton = () => {
  return (
    <a
      href={TELEGRAM_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on Telegram"
      title="Contact us on Telegram"
      id="telegram-floating-btn"
      className="fixed z-40 flex items-center justify-center h-12 w-12 sm:h-13 sm:w-13 rounded-full bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/30 hover:shadow-[#229ED9]/50 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] cursor-pointer bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-[calc(1.25rem+env(safe-area-inset-right,0px))] sm:bottom-6 sm:right-6 group"
    >
      {/* Official Telegram Plane Vector Icon */}
      <svg
        className="h-6 w-6 sm:h-6.5 sm:w-6.5 fill-current transform -translate-x-0.5 translate-y-0.5 group-hover:rotate-6 transition-transform"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.61 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.65-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.22-.04.37z" />
      </svg>
      <span className="sr-only">Contact us on Telegram</span>
    </a>
  );
};
