'use client';

import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Modal component
 */
export function Modal({ isOpen, onClose, children, className }) {
  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative bg-[var(--card)] rounded-xl shadow-xl max-h-[90vh] overflow-y-auto',
          'animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors z-10"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
