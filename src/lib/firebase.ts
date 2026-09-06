import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIeMwMy7jLyT3_azmrUh2M7oYnu5frL4U",
  authDomain: "surau-display-dev.firebaseapp.com",
  databaseURL: "https://surau-display-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "surau-display-dev",
  storageBucket: "surau-display-dev.firebasestorage.app",
  messagingSenderId: "1040738333772",
  appId: "1:1040738333772:web:a28e30ffe24b0b6db5f0e9",
  measurementId: "G-VMHZBNQNN1"
};

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics safely for browser rendering
export const analytics = typeof window !== "undefined" 
  ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
  : null;

  // Helper expected by custom hooks (e.g., useActivities)
export const getFirebase = async () => ({
  app,
  auth,
  db,
});