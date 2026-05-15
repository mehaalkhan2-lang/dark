import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  const fetchToken = async (key: string) => {
    try {
      const msg = await messaging();
      if (!msg) return null;
      const currentToken = await getToken(msg, { vapidKey: key });
      if (currentToken) {
        setToken(currentToken);
        if (auth.currentUser) {
          await setDoc(doc(db, 'push_tokens', auth.currentUser.uid), {
            token: currentToken,
            updatedAt: serverTimestamp(),
            active: true,
            platform: navigator.platform
          }, { merge: true });
        }
        return currentToken;
      }
    } catch (err) {
      console.error('Quiet Token Fetch Error:', err);
    }
    return null;
  };

  const requestPermission = async (vapidKey?: string) => {
    setLoading(true);
    const key = vapidKey || import.meta.env.VITE_VAPID_KEY || 'BLYU5oB4HTz-8HUESaZFVkFx_us2fjeZtcemcKbL6jIyBRLmkD_9EUPADXvHvG4_jJ9fQ6dZQZ-IJAeR8RFP15E';
    
    try {
      if (!key) {
        throw new Error("Missing configuration key for notifications.");
      }

      const msg = await messaging();
      if (!msg) throw new Error("Push messaging is not supported in this browser environment or requires HTTPS.");

      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        const t = await fetchToken(key);
        if (t) {
          alert("Success! Notifications are configured and ready.");
        } else {
          alert("Permission granted, but failed to generate a subscription token. Please ensure you are not in Incognito/Private mode.");
        }
      } else {
        alert("Permission denied. You won't receive push alerts until you enable them in your browser settings.");
      }
    } catch (err: any) {
      console.error('Push Error:', err);
      alert("Error: " + (err.message || "Unknown push error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const key = import.meta.env.VITE_VAPID_KEY || 'BLYU5oB4HTz-8HUESaZFVkFx_us2fjeZtcemcKbL6jIyBRLmkD_9EUPADXvHvG4_jJ9fQ6dZQZ-IJAeR8RFP15E';
      if (Notification.permission === 'granted' && key) {
        await fetchToken(key);
      }

      try {
        const msg = await messaging();
        if (!msg) return;
        onMessage(msg, (payload) => {
          console.log('Foreground Msg:', payload);
          if (payload.notification) {
            new Notification(payload.notification.title || 'DARK TRADING', {
              body: payload.notification.body,
              icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png'
            });
          }
        });
      } catch (err) {
        console.warn("FCM Listener skip:", err);
      }
    };
    init();
  }, []);

  return { token, permission, requestPermission, loading, fetchToken: () => fetchToken(import.meta.env.VITE_VAPID_KEY || 'BLYU5oB4HTz-8HUESaZFVkFx_us2fjeZtcemcKbL6jIyBRLmkD_9EUPADXvHvG4_jJ9fQ6dZQZ-IJAeR8RFP15E') };
}
