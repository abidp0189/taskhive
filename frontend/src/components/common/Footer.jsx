import React, { useState } from 'react';
import { Send, X, Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export const Footer = () => {
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const telegramLink = 'https://t.me/+TZB6c_pdeYVjNmE1';

  const handleCopyTelegram = () => {
    navigator.clipboard.writeText(telegramLink);
    setCopied(true);
    toast.success('Telegram link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md py-6 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-secondary)]">
          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/share/19aTENjZrw/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] hover:text-blue-500 hover:border-blue-500/40 transition-all shadow-sm"
              title="Facebook Community"
            >
              <svg className="h-4 w-4 fill-current text-blue-500" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-semibold text-[11px]">Facebook</span>
            </a>

            <button
              type="button"
              onClick={() => setTelegramModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] hover:text-sky-400 hover:border-sky-400/40 transition-all shadow-sm cursor-pointer"
              title="Telegram Community"
            >
              <Send className="h-4 w-4 text-sky-400" />
              <span className="font-semibold text-[11px]">Telegram</span>
            </button>

            <a
              href="https://youtube.com/@tomarkaj?si=2pwlmOHB0Taa8rjj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] hover:text-red-500 hover:border-red-500/40 transition-all shadow-sm"
              title="YouTube Channel"
            >
              <svg className="h-4 w-4 fill-current text-red-500" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="font-semibold text-[11px]">YouTube</span>
            </a>
          </div>

          {/* Copyright only */}
          <p className="font-medium text-[var(--color-text-secondary)]">
            © 2026 Tomar Kaj. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Telegram Popup Modal */}
      {telegramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-7 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setTelegramModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[var(--color-surface2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text)]">
                  Join Tomar Kaj on Telegram
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Official community and instant task updates
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--color-surface2)] border border-[var(--color-border)] space-y-2">
              <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                Telegram Link
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-sky-400 font-semibold truncate select-all">
                  {telegramLink}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTelegram}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-text)] text-[11px] font-semibold text-[var(--color-text)] transition-colors shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTelegramModalOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02]"
              >
                <Send className="h-4 w-4" /> Open Telegram Channel <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setTelegramModalOpen(false)}
                className="px-4 py-3 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
