// src/lib/firebase.js
// Firebase (Auth) — e-mail/senha + Google

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// ⚠️ Esses valores podem ficar no front-end (não são "senha"),
// mas SEMPRE configure regras de segurança no Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyBDCkT_rg9oMSSgebuCZSckiJ4yI_0KBxU",
  authDomain: "site-da-ordem.firebaseapp.com",
  projectId: "site-da-ordem",
  storageBucket: "site-da-ordem.firebasestorage.app",
  messagingSenderId: "187207259118",
  appId: "1:187207259118:web:ea4dbf087a4a4f1f91b4ff",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export const authApi = {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
};
