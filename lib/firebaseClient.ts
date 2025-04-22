// src/lib/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/** Reads public config from NEXT_PUBLIC_* env vars */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Initialise only in the browser & only once */
if (typeof window !== "undefined" && getApps().length === 0) {
  initializeApp(firebaseConfig);
}

/** Export Firestore db (undefined on the server) */
export const db = typeof window !== "undefined" ? getFirestore() : undefined;
