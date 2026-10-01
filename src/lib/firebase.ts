import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const productionFirebaseConfig = {
  apiKey: "AIzaSyB_rlJIsxAJGzPqMZqq5BX6l9eEM8KQU2g",
  authDomain: "surau-digital-display.firebaseapp.com",
  projectId: "surau-digital-display",
  storageBucket: "surau-digital-display.firebasestorage.app",
  messagingSenderId: "968646006236",
  appId: "1:968646006236:web:1cbd212aaec55d12172b19",
};

function getDevelopmentFirebaseConfig() {
  const requiredEnv = (name: string, value: string | undefined) => {
    if (!value) {
      throw new Error(`Missing ${name}; configure the Surau Display development Firebase app.`);
    }
    return value;
  };

  return {
    apiKey: requiredEnv("VITE_FIREBASE_DEV_API_KEY", import.meta.env["VITE_FIREBASE_DEV_API_KEY"]),
    authDomain: "surau-display-dev.firebaseapp.com",
    projectId: "surau-display-dev",
    storageBucket: "surau-display-dev.firebasestorage.app",
    messagingSenderId: requiredEnv(
      "VITE_FIREBASE_DEV_MESSAGING_SENDER_ID",
      import.meta.env["VITE_FIREBASE_DEV_MESSAGING_SENDER_ID"],
    ),
    appId: requiredEnv("VITE_FIREBASE_DEV_APP_ID", import.meta.env["VITE_FIREBASE_DEV_APP_ID"]),
  };
}

const firebaseConfig = import.meta.env.DEV
  ? getDevelopmentFirebaseConfig()
  : productionFirebaseConfig;


console.log("🔥 Firebase environment:", import.meta.env.DEV ? "DEVELOPMENT" : "PRODUCTION");
console.log("🔥 Firebase project:", firebaseConfig.projectId);

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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
