import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCN9jNYTyJukpErOp17YLi02Y-TEqLDoY4",
  authDomain: "kitchen-c5fc6.firebaseapp.com",
  projectId: "kitchen-c5fc6",
  storageBucket: "kitchen-c5fc6.firebasestorage.app",
  messagingSenderId: "810765720130",
  appId: "1:810765720130:web:33e5c3f20dac8cbd5c2bdb",
  measurementId: "G-CVBRF89TRL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
