import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXl4_cO_F8xXMuHzAghWGG1k_xJfYSvYY",
  authDomain: "relief-map-dafa2.firebaseapp.com",
  projectId: "relief-map-dafa2",
  storageBucket: "relief-map-dafa2.firebasestorage.app",
  messagingSenderId: "1088851741935",
  appId: "1:1088851741935:web:4c4070f1a17d4dc43d9f1a",
  measurementId: "G-HCF00YJENZ"
};

const app = initializeApp(firebaseConfig);

// Initialize Analytics (client-side only)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn("Offline persistence failed:", err);
  });
}

export default app;
