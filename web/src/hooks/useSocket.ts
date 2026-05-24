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

    // Initialize socket connection with JWT authorization header/auth token
    const socket = io(WS_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO connected successfully');
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error', error);
    });

    // Listen for custom real-time notifications
    socket.on('notification', (data) => {
      console.log('Notification received in socket client:', data);
      addNotification(data);
      
      // Dispatch custom event for browser toast/toast systems
      const event = new CustomEvent('app_toast_notification', { detail: data });
      window.dispatchEvent(event);
    });

    // Listen for live car availability updates
    socket.on('car_availability_updated', (data: { carId: string; status: string }) => {
      console.log('Car availability updated in socket client:', data);
      // Dispatch browser custom event for instant UI rerendering on detail/listing page
      const event = new CustomEvent('car_availability_changed', { detail: data });
      window.dispatchEvent(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, addNotification]);

  return socketRef.current;
};
