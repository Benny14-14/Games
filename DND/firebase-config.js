// Importiere Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Deine Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyDaP6dsTKRrKxwXqAqODxXcrqjGuUGqNzU",
  authDomain: "lurola-dnd.firebaseapp.com",
  projectId: "lurola-dnd",
  storageBucket: "lurola-dnd.firebasestorage.app",
  messagingSenderId: "236333381959",
  appId: "1:236333381959:web:cbc2f7aef9b78d3055b462",
  measurementId: "G-TNYZNW0L51"
};

// Firebase initialisieren
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
