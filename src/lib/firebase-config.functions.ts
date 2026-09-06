const config = {
  apiKey: "AIzaSyCIeMwMy7jLyT3_azmrUh2M7oYnu5frL4U",
  authDomain: "surau-display-dev.firebaseapp.com",
  databaseURL: "https://surau-display-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "surau-display-dev",
  storageBucket: "surau-display-dev.firebasestorage.app",
  messagingSenderId: "1040738333772",
  appId: "1:1040738333772:web:a28e30ffe24b0b6db5f0e9",
  measurementId: "G-VMHZBNQNN1"
};

export const getFirebaseApiKey = async () => config.apiKey;
export const getFirebaseConfig = async () => config;