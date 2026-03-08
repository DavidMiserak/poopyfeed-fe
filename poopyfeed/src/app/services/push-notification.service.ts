/**
 * Service for FCM push notifications in the browser.
 *
 * Handles:
 * - Requesting browser notification permission
 * - Getting FCM token and registering with backend
 * - Listening for foreground messages
 * - Unregistering device token on opt-out
 *
 * SSR-safe: all browser APIs guarded behind PLATFORM_ID checks.
 */

import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, catchError, of } from 'rxjs';

const DEVICES_URL = '/api/v1/notifications/devices/';

/**
 * VAPID key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates.
 * This is a public key and safe to include in client code.
 */
const VAPID_KEY =
  'BKCzoRDSmOjk4Rc3pZw6n8MkhkMsyE8HKCeCVP099X6ZA2e-oL1TVdQUNctitwX5hyUGwvd-IZs6hPjU_Jg_G8I';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  /** Whether push notifications are currently enabled on this device. */
  pushEnabled = signal(false);

  /** Firebase app and messaging instances, lazily initialized. */
  private firebaseApp: unknown = null;
  private messaging: unknown = null;
  private currentToken: string | null = null;
  private foregroundListenerActive = false;

  /** Whether the browser supports push notifications. */
  get isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'Notification' in window;
  }

  /**
   * Request notification permission, get FCM token, and register with backend.
   * Returns true if successful, false otherwise.
   */
  async requestPermission(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const token = await this.getFcmToken();
      if (!token) return false;

      // Register with backend
      await this.registerToken(token);
      this.currentToken = token;
      this.pushEnabled.set(true);
      return true;
    } catch (err) {
      console.warn('Failed to enable push notifications:', err);
      return false;
    }
  }

  /**
   * Unregister device token from backend and disable push.
   */
  async unregisterDevice(): Promise<void> {
    if (!this.currentToken) {
      this.pushEnabled.set(false);
      return;
    }

    try {
      await firstValueFrom(
        this.http
          .request('DELETE', DEVICES_URL, {
            body: { token: this.currentToken },
          })
          .pipe(catchError(() => of(null)))
      );
    } catch {
      // Best effort
    }

    this.currentToken = null;
    this.pushEnabled.set(false);
  }

  /**
   * Set up foreground message listener. Messages received while the app is in the
   * foreground will be passed to the callback.
   */
  async setupForegroundListener(
    onMessage: (payload: { title: string; body: string; data?: Record<string, string> }) => void
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.foregroundListenerActive) return;

    try {
      const { getMessaging, onMessage: fbOnMessage } = await import('firebase/messaging');
      const messaging = await this.getMessagingInstance();
      if (!messaging) return;

      fbOnMessage(messaging as ReturnType<typeof getMessaging>, (payload) => {
        const title = payload.data?.['title'] || payload.notification?.title || '';
        const body = payload.data?.['body'] || payload.notification?.body || '';
        onMessage({
          title,
          body,
          data: payload.data as Record<string, string> | undefined,
        });
      });
      this.foregroundListenerActive = true;
    } catch (err) {
      console.warn('Failed to setup foreground message listener:', err);
    }
  }

  private async getFcmToken(): Promise<string | null> {
    try {
      const { getToken } = await import('firebase/messaging');
      const messaging = await this.getMessagingInstance();
      if (!messaging) return null;

      // Register the Firebase messaging SW at its own scope
      const swRegistration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/firebase-cloud-messaging-push-scope' }
      );

      const token = await getToken(messaging as Parameters<typeof getToken>[0], {
        vapidKey: VAPID_KEY || undefined,
        serviceWorkerRegistration: swRegistration,
      });
      return token || null;
    } catch (err) {
      console.warn('Failed to get FCM token:', err);
      return null;
    }
  }

  private async getMessagingInstance(): Promise<unknown> {
    if (this.messaging) return this.messaging;

    try {
      const { initializeApp } = await import('firebase/app');
      const { getMessaging } = await import('firebase/messaging');

      const config = this.getFirebaseConfig();
      if (!config) return null;

      if (!this.firebaseApp) {
        this.firebaseApp = initializeApp(config);
      }
      this.messaging = getMessaging(this.firebaseApp as Parameters<typeof getMessaging>[0]);
      return this.messaging;
    } catch (err) {
      console.warn('Failed to initialize Firebase messaging:', err);
      return null;
    }
  }

  private getFirebaseConfig(): Record<string, string> | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    // Firebase config injected at build time or via window global
    const win = window as unknown as Record<string, unknown>;
    const config = win['__FIREBASE_CONFIG__'] as Record<string, string> | undefined;
    if (config) return config;

    // Fallback: check meta tag
    const meta = document.querySelector('meta[name="firebase-config"]');
    if (meta) {
      try {
        return JSON.parse(meta.getAttribute('content') || '');
      } catch {
        return null;
      }
    }
    return null;
  }

  private async registerToken(token: string): Promise<void> {
    await firstValueFrom(
      this.http
        .post(DEVICES_URL, { token, platform: 'web' })
        .pipe(catchError(() => of(null)))
    );
  }
}
