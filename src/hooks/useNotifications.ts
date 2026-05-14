import { useEffect, useRef } from 'react';
import { Signal } from '../types';

const WHATSAPP_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'; // A clean notification sound

export function useNotifications(signals: Signal[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSignalsCount = useRef(signals.length);
  const initializedAt = useRef(Date.now());

  useEffect(() => {
    audioRef.current = new Audio(WHATSAPP_SOUND);
    
    // Request notification permission on first load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // If we have a new signal
    if (signals.length > prevSignalsCount.current) {
      const newSignal = signals[0]; // Signals are ordered desc by createdAt in App.tsx
      
      // Only notify if the signal was created AFTER the hook initialized
      // (Buffer of 2 seconds for server-sync delay)
      const signalTime = typeof newSignal?.createdAt === 'number' ? newSignal.createdAt : Date.now();
      
      if (newSignal && signalTime > initializedAt.current - 2000) {
        // Play sound
        audioRef.current?.play().catch(e => console.log('Audio play failed:', e));

        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(`NEW SIGNAL: ${newSignal.pair}`, {
            body: `${newSignal.type.toUpperCase()} | ${newSignal.status.toUpperCase()} | Duration: ${newSignal.durationMinutes}m`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png'
          });
        }
      }
    }
    prevSignalsCount.current = signals.length;
  }, [signals]);
}
