importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCHsFdUmJFwf_WgxUobjiFB-Q6yyoD-P9s",
  authDomain: "gen-lang-client-0636203738.firebaseapp.com",
  projectId: "gen-lang-client-0636203738",
  storageBucket: "gen-lang-client-0636203738.firebasestorage.app",
  messagingSenderId: "50397708335",
  appId: "1:50397708335:web:2f8efa0c6c03aaf87606da"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Dark Trading Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New signal detected.',
    icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
