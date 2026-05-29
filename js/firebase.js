// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// My web app's Firebase production configuration
const PROD_CONFIG = {
  apiKey: "AIzaSyB_rlJIsxAJGzPqMZqq5BX6l9eEM8KQU2g",
  authDomain: "surau-digital-display.firebaseapp.com",
  projectId: "surau-digital-display",
  storageBucket: "surau-digital-display.firebasestorage.app",
  messagingSenderId: "968646006236",
  appId: "1:968646006236:web:1cbd212aaec55d12172b19",
};

// My web app's Firebase development configuration
const DEV_CONFIG = {
  apiKey: "AIzaSyCIeMwMy7jLyT3_azmrUh2M7oYnu5frL4U",
  authDomain: "surau-display-dev.firebaseapp.com",
  projectId: "surau-display-dev",
  storageBucket: "surau-display-dev.firebasestorage.app",
  messagingSenderId: "1040738333772",
  appId: "1:1040738333772:web:a28e30ffe24b0b6db5f0e9",
};

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const firebaseConfig = isLocal ? DEV_CONFIG : PROD_CONFIG;

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("Firebase Project:", firebaseConfig.projectId);
