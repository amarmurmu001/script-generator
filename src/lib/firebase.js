// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage"; // Add this import
import { getAuth } from 'firebase/auth';

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
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Storage
const auth = getAuth(app);
export { db, storage, firebaseConfig, auth, Timestamp }; 