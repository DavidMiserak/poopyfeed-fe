/**
 * Firebase Cloud Messaging background message handler.
 *
 * This script is registered at the /firebase-cloud-messaging-push-scope scope,
 * separate from Angular's ngsw-worker.js which handles the root scope.
 * The push-notification.service.ts registers this SW explicitly.
 */

/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// Initialize Firebase with project config
firebase.initializeApp({
  apiKey: "AIzaSyBYZ7TixRk_1ruHCTbYhZzjAeffPsasqfg",
  authDomain: "poopyfeed.firebaseapp.com",
  projectId: "poopyfeed",
  storageBucket: "poopyfeed.firebasestorage.app",
  messagingSenderId: "635637455070",
  appId: "1:635637455070:web:a0cc85a1f50b2791e60a4f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || 'PoopyFeed';
  const body = data.body || '';

  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data,
    tag: `poopyfeed-${data.event_type || 'notification'}-${data.child_id || ''}`,
  };

  self.registration.showNotification(title, options);
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const childId = event.notification.data?.child_id;
  const url = childId ? `/children/${childId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(() => client.navigate(url));
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});
