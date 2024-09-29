// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGfssNCcdkgGgWLMK0LglBQzf6zPCUA-M",
  authDomain: "scriptgenius-76dc5.firebaseapp.com",
  projectId: "scriptgenius-76dc5",
  storageBucket: "scriptgenius-76dc5.appspot.com",
  messagingSenderId: "888673242794",
  appId: "1:888673242794:web:9aff1fb8df8285133a4ad3",
  measurementId: "G-LP7HW9QPBW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore

export { db }; // Export db