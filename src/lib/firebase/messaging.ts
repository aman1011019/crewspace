"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { firebaseConfig, getFirebaseMessaging, getFirebaseServices } from "./client";

function buildMessagingWorkerUrl() {
  const params = new URLSearchParams();
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const query = params.toString();
  return `/firebase-messaging-sw.js${query ? `?${query}` : ""}`;
}

export async function registerFcmToken(userId: string, eventId: string) {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;

  const messaging = await getFirebaseMessaging();
  const services = getFirebaseServices();
  if (!messaging || !services) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register(buildMessagingWorkerUrl(), {
    scope: "/",
    updateViaCache: "none",
  });

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) return null;

  await setDoc(
    doc(services.db, "fcmTokens", token),
    {
      token,
      userId,
      eventId,
      platform: "web",
      userAgent: navigator.userAgent,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || "CrewSpace";
    const body = payload.notification?.body || "New event update";

    if (document.visibilityState === "visible") {
      new Notification(title, {
        body,
        icon: "/icon.svg",
        data: payload.data,
      });
    }
  });

  return token;
}
