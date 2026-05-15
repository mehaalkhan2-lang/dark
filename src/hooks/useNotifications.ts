import { useEffect, useRef } from 'react';
import { Signal } from '../types';

const WHATSAPP_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'; // A clean notification sound

export function useNotifications(signals: Signal[], session?: { isActive: boolean }, onNewNotification?: (notif: { title: string; body: string }) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSignalsCount = useRef(signals.length);
  const prevSessionActive = useRef(session?.isActive || false);
  const initializedAt = useRef(Date.now());

  useEffect(() => {
    audioRef.current = new Audio(WHATSAPP_SOUND);
    
    // Request notification permission on first load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Handle Session Notifications
    if (session?.isActive && !prevSessionActive.current) {
      const title = "TRADING SESSION LIVE";
      const body = "The official trading session has started. Check the signals!";

      audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
      onNewNotification?.({ title, body });

      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png'
        });
      }
    }
    prevSessionActive.current = session?.isActive || false;

    // Handle Signal Notifications
    if (signals.length > prevSignalsCount.current) {
      const newSignal = signals[0]; 
      
      const signalTime = typeof newSignal?.createdAt === 'number' ? newSignal.createdAt : Date.now();
      
      if (newSignal && signalTime > initializedAt.current - 2000) {
        const title = `NEW ${newSignal.type.toUpperCase()} SIGNAL: ${newSignal.pair}`;
        const body = `${newSignal.direction || 'Alert'} Order • ${newSignal.durationMinutes}m Expiry • Entry ${newSignal.entryPrice || 'Market'}`;

        // Play sound
        audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
        onNewNotification?.({ title, body });

        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png'
          });
        }
      }
    }
    prevSignalsCount.current = signals.length;
  }, [signals, session, onNewNotification]);
}
