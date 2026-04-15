import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXl4_cO_F8xXMuHzAghWGG1k_xJfYSvYY",
  authDomain: "relief-map-dafa2.firebaseapp.com",
  projectId: "relief-map-dafa2",
  storageBucket: "relief-map-dafa2.firebasestorage.app",
  messagingSenderId: "1088851741935",
  appId: "1:1088851741935:web:4c4070f1a17d4dc43d9f1a",
  measurementId: "G-HCF00YJENZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure auth
auth.settings.appVerificationDisabledForTesting = false;

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics (only in browser)
let analytics: any;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  
  // Enable offline persistence
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence disabled');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported in this browser');
    }
  });
}

export { app, auth, db, googleProvider, analytics };

