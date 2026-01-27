
import { getApps, getApp, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID?.trim()
};

import { getMessaging } from "firebase/messaging";

// Singleton pattern for SSR/HMR
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
export { app };

