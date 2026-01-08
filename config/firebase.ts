// src/config/firebase.ts

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCN9jNYTyJukpErOp17YLi02Y-TEqLDoY4",
  authDomain: "kitchen-c5fc6.firebaseapp.com",
  projectId: "kitchen-c5fc6",
  storageBucket: "kitchen-c5fc6.firebasestorage.app",
  messagingSenderId: "810765720130",
  appId: "1:810765720130:web:33e5c3f20dac8cbd5c2bdb",
  measurementId: "G-CVBRF89TRL",
};

// ✅ Prevent re-init in hot reload / multiple imports
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ✅ Firestore
export const db = getFirestore(app);

// ✅ Auth
export const auth = getAuth(app);

// ✅ Storage
export const storage = getStorage(app);

export default app;
