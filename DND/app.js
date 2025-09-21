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
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  query,
  where,
  getDocs
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

    await loadUserGames(user.uid);
  } else {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("user-section").style.display = "none";
  }
});

// --- Spiel erstellen ---
document.getElementById("create-game-btn").addEventListener("click", async () => {
  const gameName = document.getElementById("game-name").value;
  const user = auth.currentUser;

  if (!gameName || !user) return;

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const gameRef = await addDoc(collection(db, "games"), {
    name: gameName,
    joinCode: joinCode,
    gamemasterId: user.uid,
    players: [user.uid]
  });

  await updateDoc(doc(db, "users", user.uid), {
    games: arrayUnion(gameRef.id)
  });

  alert(`Spiel "${gameName}" erstellt! Beitrittscode: ${joinCode}`);
  await loadUserGames(user.uid);
});

// --- Spiel beitreten ---
document.getElementById("join-game-btn").addEventListener("click", async () => {
  const code = document.getElementById("join-code").value.trim();
  const user = auth.currentUser;

  if (!code || !user) return;

  const q = query(collection(db, "games"), where("joinCode", "==", code));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    alert("Kein Spiel mit diesem Code gefunden!");
    return;
  }

  querySnapshot.forEach(async (gameDoc) => {
    const gameId = gameDoc.id;

    await updateDoc(doc(db, "games", gameId), {
      players: arrayUnion(user.uid)
    });

    await updateDoc(doc(db, "users", user.uid), {
      games: arrayUnion(gameId)
    });

    alert("Spiel beigetreten!");
    await loadUserGames(user.uid);
  });
});

// --- Eigene Spiele laden ---
async function loadUserGames(userId) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const gamesList = document.getElementById("games-list");
  gamesList.innerHTML = "";

  for (let gameId of userData.games || []) {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (gameSnap.exists()) {
      const li = document.createElement("li");
      const game = gameSnap.data();
      li.textContent = `${game.name} (Code: ${game.joinCode})`;
      li.addEventListener("click", () => openCharacterEditor(gameId));
      gamesList.appendChild(li);
    }
  }
}

// --- Charaktereditor öffnen ---
function openCharacterEditor(gameId) {
  document.getElementById("character-section").style.display = "block";

  document.getElementById("save-char-btn").onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const charName = document.getElementById("char-name").value;
    const hp = parseInt(document.getElementById("char-hp").value);
    const mana = parseInt(document.getElementById("char-mana").value);
    const charClass = document.getElementById("char-class").value;

    const charData = {
      charName,
      hp,
      mana,
      class: charClass
    };

    await setDoc(
      doc(db, "games", gameId, "players", user.uid),
      charData
    );

    document.getElementById("char-display").innerHTML = `
      <p><strong>Name:</strong> ${charName}</p>
      <p><strong>HP:</strong> ${hp}</p>
      <p><strong>Mana:</strong> ${mana}</p>
      <p><strong>Klasse:</strong> ${charClass}</p>
    `;
  };
}
