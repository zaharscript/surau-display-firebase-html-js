import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_rlJIsxAJGzPqMZqq5BX6l9eEM8KQU2g",
  authDomain: "surau-digital-display.firebaseapp.com",
  projectId: "surau-digital-display",
  storageBucket: "surau-digital-display.firebasestorage.app",
  messagingSenderId: "968646006236",
  appId: "1:968646006236:web:1cbd212aaec55d12172b19",
};

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics safely for browser rendering
export const analytics =
  typeof window !== "undefined"
    ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
    : null;

// Helper expected by custom hooks (e.g., useActivities)
export const getFirebase = async () => ({
  app,
  auth,
  db,
});
