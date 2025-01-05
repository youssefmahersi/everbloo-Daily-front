// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // your firebase config here
  apiKey: "AIzaSyC0FKwcQBJ8VfxKBtE7-cRve2rCq2e9tIg",
  authDomain: "everbloo-front.firebaseapp.com",
  projectId: "everbloo-front",
  storageBucket: "everbloo-front.firebasestorage.app",
  messagingSenderId: "1054206589869",
  appId: "1:1054206589869:web:8eecc4e10740596ef0bf24",
  measurementId: "G-1RJ6SSGZMR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
