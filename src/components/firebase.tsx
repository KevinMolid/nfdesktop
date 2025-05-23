// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD0TSDSV6k-U16qR-4_4Vu7daso8dF2BTk",
  authDomain: "nfdashboard-c2272.firebaseapp.com",
  projectId: "nfdashboard-c2272",
  storageBucket: "nfdashboard-c2272.firebasestorage.app",
  messagingSenderId: "455778339436",
  appId: "1:455778339436:web:ed7f36cdd82db5c8e96649",
  measurementId: "G-GN2JSB0MBK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore instance
export const db = getFirestore(app);
