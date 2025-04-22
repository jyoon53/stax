// lib/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const clientApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(clientApp); // ← **never undefined**
