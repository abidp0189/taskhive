import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn } from 'lucide-react';

export const ImageLightboxModal = ({ isOpen, onClose, src, title = 'Screenshot Proof' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleDownload = (e) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = src;
    a.download = `proof-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity cursor-zoom-out"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center z-10 overflow-hidden rounded-2xl bg-gray-950 border border-gray-800 shadow-2xl"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/90 border-b border-gray-800 text-white text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-gray-200">
              <ZoomIn className="h-4 w-4 text-indigo-400" /> {title}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center gap-1.5 transition-colors font-medium text-xs"
                title="Download image"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="w-full max-h-[80vh] overflow-auto p-4 flex items-center justify-center bg-black/80">
            <img
              src={src}
              alt={title}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-xl select-none"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
