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
        let borderColor = "border-border";
        let iconColor = "text-accent bg-bg-surface-alt";
        let Icon = Bell;

        if (toast.type === 'success') {
          borderColor = "border-status-success";
          iconColor = "text-status-success bg-status-success-bg";
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          borderColor = "border-status-danger";
          iconColor = "text-status-danger bg-status-danger-bg";
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border bg-bg-surface text-text-primary ${borderColor}`}
          >
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 text-sm font-bold leading-normal">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-opacity"
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
