import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from './Icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  text: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (text: string, title?: string) => void;
    error: (text: string, title?: string) => void;
    warning: (text: string, title?: string) => void;
    info: (text: string, title?: string) => void;
  };
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((params: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = params.duration || 4000;
    
    setToasts((prev) => [...prev, { ...params, id }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (text: string, title?: string) => showToast({ type: 'success', text, title }),
    error: (text: string, title?: string) => showToast({ type: 'error', text, title }),
    warning: (text: string, title?: string) => showToast({ type: 'warning', text, title }),
    info: (text: string, title?: string) => showToast({ type: 'info', text, title }),
  };

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div 
        id="toast-notification-container"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((item) => {
            // Setup style attributes depending on type
            let bgStyle = 'bg-slate-950/90 border-white/10';
            let iconColor = 'text-indigo-400';
            let iconName = 'Sparkles';
            let highlightBar = 'bg-indigo-505';

            switch (item.type) {
              case 'success':
                bgStyle = 'bg-slate-900/90 border-emerald-500/20 backdrop-blur-md';
                iconColor = 'text-emerald-400';
                iconName = 'CheckCircle';
                highlightBar = 'bg-emerald-500';
                break;
              case 'error':
                bgStyle = 'bg-slate-900/90 border-rose-500/25 backdrop-blur-md';
                iconColor = 'text-rose-400';
                iconName = 'AlertTriangle';
                highlightBar = 'bg-rose-500';
                break;
              case 'warning':
                bgStyle = 'bg-slate-900/90 border-amber-500/25 backdrop-blur-md';
                iconColor = 'text-amber-400';
                iconName = 'HelpCircle';
                highlightBar = 'bg-amber-500';
                break;
              case 'info':
                bgStyle = 'bg-slate-900/90 border-blue-500/25 backdrop-blur-md';
                iconColor = 'text-indigo-400';
                iconName = 'Sparkle';
                highlightBar = 'bg-indigo-400';
                break;
            }

            return (
              <motion.div
                key={item.id}
                id={`toast-item-${item.id}`}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex w-full overflow-hidden rounded-2xl border ${bgStyle} shadow-2xl p-4 relative pr-10`}
              >
                {/* Left decorative bar */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${highlightBar}`} />

                <div className="flex gap-3 items-start pl-1.5">
                  <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                    <DynamicIcon name={iconName} size={18} />
                  </div>
                  <div>
                    {item.title && (
                      <h4 className="text-xs font-bold text-white mb-0.5">{item.title}</h4>
                    )}
                    <p className="text-xs font-medium text-slate-200 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  id={`toast-dismiss-${item.id}`}
                  onClick={() => removeToast(item.id)}
                  className="absolute top-3.5 right-3 h-5 w-5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  <DynamicIcon name="X" size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
