'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const notification = customEvent.detail;
      const newToast: ToastMessage = {
        id: notification.id || Math.random().toString(),
        message: notification.message || 'Notification received!',
        type: notification.type || 'info',
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('app_toast_notification', handleToast);
    return () => {
      window.removeEventListener('app_toast_notification', handleToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        let typeStyles = "border-border bg-card text-card-foreground";
        let iconColor = "bg-primary/10 text-primary";
        let Icon = Bell;

        if (toast.type === 'success') {
          typeStyles = "border-emerald-500/20 bg-emerald-950/80 text-emerald-200 shadow-lg shadow-emerald-950/10";
          iconColor = "bg-emerald-500/20 text-emerald-300";
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          typeStyles = "border-rose-500/20 bg-rose-950/80 text-rose-200 shadow-lg shadow-rose-950/10";
          iconColor = "bg-rose-500/20 text-rose-300";
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 ${typeStyles}`}
          >
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const showLocalToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const event = new CustomEvent('app_toast_notification', {
    detail: { id: Math.random().toString(), message, type },
  });
  window.dispatchEvent(event);
};
