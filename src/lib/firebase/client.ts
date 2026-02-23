import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// To prevent crashes during Next.js build when ENV vars are missing
const isFirebaseInitialized = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const app = isFirebaseInitialized
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : (null as unknown as ReturnType<typeof initializeApp>);

const auth = isFirebaseInitialized
  ? getAuth(app)
  : (null as unknown as ReturnType<typeof getAuth>);

export { app, auth };
