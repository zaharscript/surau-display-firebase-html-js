import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const qurbanApp =
  getApps().find((app) => app.name === "qurban-stats") ??
  initializeApp(
    {
      apiKey: "AIzaSyDZ8Mza6QkE8Fr41ZT-7v7QLbq19WEDrKY",
      authDomain: "tabung-simpanan-qurban.firebaseapp.com",
      projectId: "tabung-simpanan-qurban",
      storageBucket: "tabung-simpanan-qurban.firebasestorage.app",
      messagingSenderId: "968260513957",
      appId: "1:968260513957:web:7e5de0bbe069115faa5d4c",
      measurementId: "G-Q360SE9B92",
    },
    "qurban-stats",
  );

export const qurbanDb = getFirestore(qurbanApp, "tabung-qurban-dahlia");

export interface QurbanCycle {
  id: string;
  status: "open" | "closed";
}

export interface QurbanMember {
  id: string;
  cycleId: string;
  portionCount: number;
  status: "active" | "deactivated";
}

export interface QurbanSaving {
  memberId: string;
  amount: number;
  isVoided: boolean;
}

export interface QurbanStats {
  totalSavings: number;
  registeredMembers: number;
  committedShares: number;
}
