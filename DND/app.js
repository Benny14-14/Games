import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- Registrierung ---
document.getElementById("register-btn").addEventListener("click", async () => {
  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      role: "player",
      games: []
    });

    alert("Registrierung erfolgreich!");
  } catch (error) {
    alert("Fehler: " + error.message);
  }
});

// --- Login ---
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login erfolgreich!");
  } catch (error) {
    alert("Fehler: " + error.message);
  }
});

// --- Logout ---
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
});

// --- Auth-Status überwachen ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("user-section").style.display = "block";
    document.getElementById("display-username").innerText = user.displayName || user.email;
  } else {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("user-section").style.display = "none";
  }
});
