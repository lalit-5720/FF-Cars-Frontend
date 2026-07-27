import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    let socket: Socket | null = null;

    try {
      // Initialize socket connection with token and safe reconnection options
      socket = io(WS_URL, {
        auth: {
          token: accessToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 2,
        timeout: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        // Socket.IO connected cleanly
      });

      socket.on('disconnect', () => {
        // Socket.IO disconnected
      });

      socket.on('connect_error', () => {
        // Gracefully handle backend WS server absence without throwing browser errors
      });

      // Listen for custom real-time notifications
      socket.on('notification', (data) => {
        if (data) {
          addNotification(data);
          const event = new CustomEvent('app_toast_notification', { detail: data });
          window.dispatchEvent(event);
        }
      });

      // Listen for live car availability updates
      socket.on('car_availability_updated', (data: { carId: string; status: string }) => {
        if (data) {
          const event = new CustomEvent('car_availability_changed', { detail: data });
          window.dispatchEvent(event);
        }
      });
    } catch (err) {
      // Silent error handler
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken, addNotification]);

  return socketRef.current;
};
