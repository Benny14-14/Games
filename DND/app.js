// app.js
import { auth, db, storage } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
  collection, addDoc, query, where, getDocs, onSnapshot, orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

/* ------------------------
   Helper / DOM shortcuts
   ------------------------ */
const $ = id => document.getElementById(id);
const show = id => $(id) && $(id).classList.remove('hidden');
const hide = id => $(id) && $(id).classList.add('hidden');

let me = null;
let currentGameId = null;
let currentGameUnsub = null;
let chatUnsub = null;
let audio = $('global-audio');
let audioPlaylist = [];
let audioIndex = 0;
let mapState = { scale: 1, x: 0, y: 0 };

/* ------------------------
   AUTH: register / login
   ------------------------ */

$('btn-register').addEventListener('click', async ()=>{
  const username = $('reg-username').value.trim();
  const email = $('reg-email').value.trim();
  const pw = $('reg-password').value;
  if(!pw) return alert('Passwort erforderlich');

  // If no email: create placeholder (username required then)
  let authEmail = email;
  if(!authEmail){
    if(!username) return alert('Bitte Benutzername oder Email angeben');
    authEmail = `${username}@local.users`;
  }

  try{
    const uc = await createUserWithEmailAndPassword(auth, authEmail, pw);
    const user = uc.user;
    if(username) await updateProfile(user, { displayName: username });
    await setDoc(doc(db,'users',user.uid), {
      username: username || null,
      email: email || null,
      loginEmail: authEmail,
      role: 'player',
      games: [],
      createdAt: serverTimestamp()
    });
    $('auth-msg').textContent = 'Registrierung erfolgreich';
  }catch(e){
    $('auth-msg').textContent = 'Fehler: '+e.message;
  }
});

$('btn-login').addEventListener('click', async ()=>{
  const ident = $('login-identifier').value.trim();
  const pw = $('login-password').value;
  if(!ident || !pw) return $('auth-msg').textContent = 'Bitte Daten eingeben';

  let emailToUse = ident;
  if(!ident.includes('@')){
    // treat as username -> lookup
    const q = query(collection(db,'users'), where('username','==',ident));
    const snap = await getDocs(q);
    if(snap.empty) return $('auth-msg').textContent = 'Benutzername nicht gefunden';
    const data = snap.docs[0].data();
    emailToUse = data.loginEmail || data.email;
    if(!emailToUse) return $('auth-msg').textContent = 'Kein E-Mail für Benutzer gefunden';
  }

  try{
    await signInWithEmailAndPassword(auth, emailToUse, pw);
    $('auth-msg').textContent = '';
  }catch(e){
    $('auth-msg').textContent = 'Login fehlgeschlagen: '+e.message;
  }
});

onAuthStateChanged(auth, async user=>{
  me = user;
  if(user){
    $('auth').classList.add('hidden');
    $('lobby').classList.remove('hidden');
    $('top-actions').innerHTML = `<span>${user.displayName||user.email}</span> <button id="btn-logout">Logout</button>`;
    $('btn-logout').onclick = async ()=>{
      // set offline flag
      await updateDoc(doc(db,'users',user.uid), { online: false, lastLogin: serverTimestamp() }).catch(()=>{});
      await signOut(auth);
    };
    // ensure user doc exists
    const uDoc = await getDoc(doc(db,'users',user.uid));
    if(!uDoc.exists()){
      await setDoc(doc(db,'users',user.uid), {
        username: user.displayName || null,
        email: user.email || null,
        loginEmail: user.email || null,
        role: 'player',
        games: [],
        createdAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db,'users',user.uid), { online: true, lastLogin: serverTimestamp() }).catch(()=>{});
    }
    loadLobbyData();
  } else {
    // logged out
    $('auth').classList.remove('hidden');
    $('lobby').classList.add('hidden');
    $('game-view').classList.add('hidden');
    $('admin').classList.add('hidden');
    $('top-actions').innerHTML = '';
  }
});

/* ------------------------
   LOBBY: create / join / list
   ------------------------ */

async function loadLobbyData(){
  // list open games (limit 10)
  const q = query(collection(db,'games'));
  const snap = await getDocs(q);
  const open = $('open-games'); open.innerHTML = '';
  snap.forEach(d=>{
    const g=d.data();
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<strong>${g.name}</strong> <small>${g.joinCode||''}</small><div>${g.desc||''}</div><button data-id="${d.id}" class="btn-join">Beitreten</button>`;
    open.appendChild(el);
    el.querySelector('.btn-join').onclick = ()=> joinGameById(d.id);
  });

  // list my games
  const meDoc = await getDoc(doc(db,'users',me.uid));
  const mg = $('games-list'); mg.innerHTML = '';
  const games = (meDoc.exists() ? meDoc.data().games || [] : []);
  for(const gid of games){
    const gd = await getDoc(doc(db,'games',gid));
    if(!gd.exists()) continue;
    const g = gd.data();
    const item = document.createElement('div'); item.className='card';
    item.innerHTML = `<strong>${g.name}</strong> <small>${g.joinCode||''}</small><div>${g.desc||''}</div>
      <button data-id="${gid}" class="btn-open">Öffnen</button>`;
    mg.appendChild(item);
    item.querySelector('.btn-open').onclick = ()=> openGame(gid);
  }
}

$('btn-create-game').addEventListener('click', async ()=>{
  const name = $('new-game-name').value.trim() || 'Neues Spiel';
  const code = Math.random().toString(36).substring(2,8).toUpperCase();
  const mapUrl = $('new-game-map').value.trim() || '';
  const desc = $('new-game-desc').value.trim() || '';
  const statsRaw = $('new-game-stats').value.trim();
  const stats = statsRaw ? statsRaw.split(',').map(s=>s.trim()) : ['HP','Mana'];
  let classes = [];
  try{
    classes = $('new-game-classes').value.trim() ? JSON.parse($('new-game-classes').value.trim()) : [];
  }catch(e){
    return alert('Klassen JSON ungültig');
  }
  const classUnique = $('new-game-class-unique').value === 'true';

  const gameRef = await addDoc(collection(db,'games'), {
    name, joinCode: code, owner: me.uid, mapUrl, desc,
    settings: { stats, classes, classUnique, allowAssign: true, currency: '' },
    createdAt: serverTimestamp()
  });

  // add players subcollection with GM
  await setDoc(doc(db,'games',gameRef.id,'players',me.uid), {
    uid: me.uid, role: 'GM', characterName: null, class: null, stats: {}, avatar: null
  });

  // add pointer in user doc
  await updateDoc(doc(db,'users',me.uid), { games: arrayUnion(gameRef.id) });

  alert(`Spiel erstellt — Code: ${code}`);
  loadLobbyData();
});

$('btn-join-code').addEventListener('click', async ()=>{
  const code = $('join-code').value.trim().toUpperCase();
  if(!code) return alert('Code eingeben');
  const q = query(collection(db,'games'), where('joinCode','==',code));
  const snap = await getDocs(q);
  if(snap.empty) return alert('Kein Spiel mit diesem Code');
  const gdoc = snap.docs[0];
  await addPlayerToGame(gdoc.id, me.uid);
  alert('Beigetreten');
  loadLobbyData();
});

async function addPlayerToGame(gameId, uid){
  // create player doc
  await setDoc(doc(db,'games',gameId,'players',uid), {
    uid, role: 'player', characterName: null, class: null, stats: {}, avatar: null
  });
  // add to user's games list
  await updateDoc(doc(db,'users',uid), { games: arrayUnion(gameId) });
}

async function joinGameById(id){
  await addPlayerToGame(id, me.uid);
  loadLobbyData();
}

/* ------------------------
   Open Game view & realtime listeners
   ------------------------ */

async function openGame(gameId){
  currentGameId = gameId;
  $('lobby').classList.add('hidden');
  $('game-view').classList.remove('hidden');
  $('game-title').textContent = 'Lade...';
  if(currentGameUnsub) currentGameUnsub();

  // subscribe to game doc
  const gRef = doc(db,'games',gameId);
  currentGameUnsub = onSnapshot(gRef, snap=>{
    if(!snap.exists()) return;
    const g = snap.data();
    renderGame(g, gameId);
  });

  // chat listener (subcollection)
  if(chatUnsub) chatUnsub();
  const chatQ = query(collection(db,'games',gameId,'chat'), orderBy('createdAt','asc'));
  chatUnsub = onSnapshot(chatQ, snap=>{
    const win = $('chat-window'); win.innerHTML = '';
    snap.forEach(m => {
      const d = m.data();
      const el = document.createElement('div');
      el.innerHTML = `<small class="muted">${d.fromName||d.from}</small>: ${d.text}`;
      win.appendChild(el);
    });
    win.scrollTop = win.scrollHeight;
  });

  // music listener handled inside renderGame
}

async function renderGame(gameDoc, gameId){
  $('game-title').textContent = gameDoc.name || 'Spiel';
  $('game-code').textContent = gameDoc.joinCode ? `Code: ${gameDoc.joinCode}` : '';
  // show GM controls only if me is owner
  const isGM = gameDoc.owner === me.uid;
  if(isGM) $('gm-controls').classList.remove('hidden'); else $('gm-controls').classList.add('hidden');

  // players list
  const playersList = $('players-list'); playersList.innerHTML = '';
  const playersSnap = await getDocs(collection(db,'games',gameId,'players'));
  playersSnap.forEach(pDoc=>{
    const p = pDoc.data();
    const el = document.createElement('div'); el.className='player-item';
    el.innerHTML = `<div class="row"><img src="${p.avatar || 'https://via.placeholder.com/48'}" width="36" style="border-radius:6px"> <div><strong>${p.characterName || p.uid}</strong><br/><small>${p.role||''}</small></div></div>`;
    el.onclick = ()=> openPlayerCard(pDoc.id);
    playersList.appendChild(el);
  });

  // map
  if(gameDoc.mapUrl){
    $('map-image').src = gameDoc.mapUrl;
  } else {
    $('map-image').src = '';
  }
  // render tokens (we'll read player positions if any)
  renderTokens(gameId);

  // load gm settings into controls
  const s = gameDoc.settings || {};
  $('gm-stats').value = (s.stats||[]).join(',');
  $('gm-classes').value = JSON.stringify(s.classes || []);
  $('gm-class-unique').value = s.classUnique ? 'true' : 'false';
  $('gm-allow-assign').value = (s.allowAssign===false) ? 'false' : 'true';
  $('gm-currency').value = s.currency || '';

  // music playlist
  audioPlaylist = (gameDoc.music || []);
  audioIndex = gameDoc.musicPointer || 0;
  renderMusicList();
  syncMusic(gameId, gameDoc);
}

/* ------------------------
   Tokens & Map
   ------------------------ */

async function renderTokens(gameId){
  const layer = $('tokens-layer'); layer.innerHTML = '';
  const playersSnap = await getDocs(collection(db,'games',gameId,'players'));
  playersSnap.forEach(pDoc=>{
    const p = pDoc.data();
    const pos = p.pos || {x:50,y:50};
    const token = document.createElement('div'); token.className='token';
    token.style.left = pos.x+'%'; token.style.top = pos.y+'%';
    token.dataset.uid = p.uid;
    const img = document.createElement('img'); img.src = p.avatar || 'https://via.placeholder.com/48';
    img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover';
    token.appendChild(img);
    token.onclick = ()=> openPlayerCard(p.uid);
    layer.appendChild(token);

    // drag handler for GM
    token.addEventListener('mousedown', async (ev)=>{
      const gdoc = (await getDoc(doc(db,'games',currentGameId))).data();
      if(gdoc.owner !== me.uid) return; // only GM
      const wrapper = $('map-wrapper');
      const onMove = (e)=>{
        const rect = wrapper.getBoundingClientRect();
        const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        token.style.left = (px*100)+'%';
        token.style.top = (py*100)+'%';
      };
      const onUp = async (e)=>{
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        const rect = $('map-wrapper').getBoundingClientRect();
        const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        // save pos
        await updateDoc(doc(db,'games',currentGameId,'players',p.uid), { pos: { x: px*100, y: py*100 } });
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  });
}

/* ------------------------
   Chat
   ------------------------ */

$('btn-send-chat').addEventListener('click', async ()=>{
  const text = $('chat-text').value.trim();
  if(!text) return;
  const userDoc = (await getDoc(doc(db,'users',me.uid))).data();
  await addDoc(collection(db,'games',currentGameId,'chat'), {
    from: me.uid,
    fromName: userDoc.username || userDoc.email || me.uid,
    text,
    createdAt: serverTimestamp()
  });
  $('chat-text').value='';
});

/* ------------------------
   Music sync
   ------------------------ */

function renderMusicList(){
  const wrap = $('music-list'); wrap.innerHTML = '';
  audioPlaylist.forEach((it, idx)=>{
    const el = document.createElement('div');
    el.innerHTML = `${idx===audioIndex? '► ':''}${it.title || it.url} <button data-i="${idx}" class="btn-play-track">Play</button>`;
    wrap.appendChild(el);
    el.querySelector('.btn-play-track').onclick = ()=> setMusicPointer(idx);
  });
}

async function setMusicPointer(i){
  await updateDoc(doc(db,'games',currentGameId), { musicPointer: i });
}
$('music-prev').addEventListener('click', async ()=> {
  let g = (await getDoc(doc(db,'games',currentGameId))).data();
  const len = (g.music||[]).length;
  const np = ((g.musicPointer||0)-1+len)%Math.max(1,len);
  await updateDoc(doc(db,'games',currentGameId), { musicPointer: np });
});
$('music-next').addEventListener('click', async ()=> {
  let g = (await getDoc(doc(db,'games',currentGameId))).data();
  const len = (g.music||[]).length;
  const np = ((g.musicPointer||0)+1)%Math.max(1,len);
  await updateDoc(doc(db,'games',currentGameId), { musicPointer: np });
});
$('music-toggle').addEventListener('click', ()=> {
  if(audio.paused) audio.play(); else audio.pause();
});

function syncMusic(gameId, gameDoc){
  const pl = gameDoc.music || [];
  audioPlaylist = pl;
  audioIndex = gameDoc.musicPointer || 0;
  if(pl[audioIndex] && pl[audioIndex].url){
    if(audio.src !== pl[audioIndex].url) {
      audio.src = pl[audioIndex].url;
      audio.play().catch(()=>console.warn('Autoplay blocked'));
    }
  }
  renderMusicList();
}

/* Add music track (GM) */
$('btn-add-music').addEventListener('click', async ()=>{
  const url = $('music-url').value.trim();
  if(!url) return alert('URL eingeben');
  const gameRef = doc(db,'games',currentGameId);
  const gdoc = (await getDoc(gameRef)).data();
  if(gdoc.owner !== me.uid) return alert('Nur GM darf Playlist verändern');
  const newTrack = { url, title: url.split('/').pop() };
  await updateDoc(gameRef, { music: arrayUnion(newTrack) });
  $('music-url').value='';
});

/* ------------------------
   Map upload (Storage)
   ------------------------ */

$('map-upload').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const gameRef = await getDoc(doc(db,'games',currentGameId));
  if(gameRef.data().owner !== me.uid) return alert('Nur GM kann Map hochladen');
  const r = storageRef(storage, `games/${currentGameId}/map/${file.name}`);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  await updateDoc(doc(db,'games',currentGameId), { mapUrl: url });
});

/* ------------------------
   Avatar upload
   ------------------------ */

$('avatar-upload').addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const r = storageRef(storage, `users/${me.uid}/avatar/${f.name}`);
  await uploadBytes(r, f);
  const url = await getDownloadURL(r);
  await updateDoc(doc(db,'games',currentGameId,'players',me.uid), { avatar: url });
  await updateDoc(doc(db,'users',me.uid), { avatar: url }).catch(()=>{});
  $('my-avatar').src = url;
});

/* ------------------------
   Dice
   ------------------------ */
document.querySelectorAll('.dice').forEach(b=>{
  b.addEventListener('click', async ()=>{
    const d = parseInt(b.dataset.d,10);
    const roll = Math.floor(Math.random()*d)+1;
    // post to chat
    await addDoc(collection(db,'games',currentGameId,'chat'), {
      from: me.uid, fromName: me.displayName||me.email, text: `Würfelt W${d}: ${roll}`, createdAt: serverTimestamp()
    });
  });
});

/* ------------------------
   Character edit / save
   ------------------------ */

$('btn-edit-char').addEventListener('click', async ()=>{
  // show modal and populate
  $('char-modal').classList.remove('hidden');
  const playerDoc = (await getDoc(doc(db,'games',currentGameId,'players',me.uid)));
  const pdata = playerDoc.exists() ? playerDoc.data() : {};
  $('char-name').value = pdata.characterName || '';
  $('char-class').value = pdata.class || '';
  // dynamic stats
  const gameDoc = (await getDoc(doc(db,'games',currentGameId))).data();
  const stats = (gameDoc.settings && gameDoc.settings.stats) || ['HP','Mana'];
  const dyn = $('dyn-stats'); dyn.innerHTML = '';
  for(const s of stats){
    const input = document.createElement('input'); input.placeholder = s; input.id = 'stat-'+s;
    input.value = pdata.stats && pdata.stats[s] ? pdata.stats[s] : '';
    dyn.appendChild(input);
  }
});

$('btn-close-char').addEventListener('click', ()=> $('char-modal').classList.add('hidden'));

$('btn-save-char').addEventListener('click', async ()=>{
  const name = $('char-name').value.trim();
  const cls = $('char-class').value.trim();
  const gameDoc = (await getDoc(doc(db,'games',currentGameId))).data();
  const statsArr = (gameDoc.settings && gameDoc.settings.stats) || ['HP','Mana'];
  const stObj = {};
  for(const s of statsArr){
    const v = $('stat-'+s).value;
    stObj[s] = isNaN(parseInt(v,10)) ? v : parseInt(v,10);
  }
  await setDoc(doc(db,'games',currentGameId,'players',me.uid), {
    uid: me.uid, characterName: name, class: cls, stats: stObj, role: 'player'
  }, { merge: true });
  $('char-modal').classList.add('hidden');
});

/* ------------------------
   GM controls save
   ------------------------ */
$('btn-save-gm').addEventListener('click', async ()=>{
  const stats = $('gm-stats').value.trim() ? $('gm-stats').value.trim().split(',').map(s=>s.trim()) : ['HP','Mana'];
  let classes = [];
  try{ classes = $('gm-classes').value.trim() ? JSON.parse($('gm-classes').value.trim()) : []; }catch(e){ return alert('Klassen JSON ungültig'); }
  const unique = $('gm-class-unique').value === 'true';
  const allowAssign = $('gm-allow-assign').value === 'true';
  const currency = $('gm-currency').value.trim();

  const gRef = doc(db,'games',currentGameId);
  const gdoc = (await getDoc(gRef)).data();
  if(gdoc.owner !== me.uid) return alert('Nur GM darf Einstellungen speichern');
  await updateDoc(gRef, { settings: { stats, classes, classUnique: unique, allowAssign, currency } });
  alert('Einstellungen gespeichert');
});

/* ------------------------
   Player card open
   ------------------------ */
async function openPlayerCard(uid){
  const pdoc = (await getDoc(doc(db,'games',currentGameId,'players',uid)));
  if(!pdoc.exists()) return alert('Keine Daten');
  const p = pdoc.data();
  // show as modal (simpler: alert)
  alert(`Charakter: ${p.characterName||p.uid}\nKlasse: ${p.class || '-'}\nStats: ${JSON.stringify(p.stats||{})}`);
}

/* ------------------------
   Leave game
   ------------------------ */
$('leave-game').addEventListener('click', async ()=>{
  if(!confirm('Spiel verlassen?')) return;
  // remove player doc and from user.games
  await updateDoc(doc(db,'users',me.uid), { games: arrayRemove(currentGameId) }).catch(()=>{});
  await updateDoc(doc(db,'games',currentGameId), { /* keep game doc, players as subcollection removed */ }).catch(()=>{});
  await (async ()=>{ try{ await setDoc(doc(db,'games',currentGameId,'players',me.uid), {}, { merge: false }); } catch(e){} })();
  // simpler: delete subdoc
  // redirect to lobby
  currentGameId = null;
  if(currentGameUnsub) currentGameUnsub();
  $('game-view').classList.add('hidden');
  $('lobby').classList.remove('hidden');
  loadLobbyData();
});

/* ------------------------
   Utility: load lobby on start
   ------------------------ */
async function loadLobbyData(){
  // called earlier and after changes
  await loadLobbyDataInternal();
}
async function loadLobbyDataInternal(){
  const q = query(collection(db,'games'));
  const snap = await getDocs(q);
  const open = $('open-games'); open.innerHTML = '';
  snap.forEach(d=>{
    const g=d.data();
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<strong>${g.name}</strong> <small>${g.joinCode||''}</small><div>${g.desc||''}</div><button data-id="${d.id}" class="btn-join">Beitreten</button>`;
    open.appendChild(el);
    el.querySelector('.btn-join').onclick = ()=> joinGameById(d.id);
  });

  // my games
  const meDoc = (await getDoc(doc(db,'users',me.uid))).data();
  const mg = $('games-list'); mg.innerHTML = '';
  for(const gid of (meDoc.games || [])){
    const gd = await getDoc(doc(db,'games',gid));
    if(!gd.exists()) continue;
    const g = gd.data();
    const item = document.createElement('div'); item.className='card';
    item.innerHTML = `<strong>${g.name}</strong> <small>${g.joinCode||''}</small><div>${g.desc||''}</div>
      <button data-id="${gid}" class="btn-open">Öffnen</button>`;
    mg.appendChild(item);
    item.querySelector('.btn-open').onclick = ()=> openGame(gid);
  }
}

/* ------------------------
   Initial UI setup
   ------------------------ */
(function init(){
  hide('game-view'); hide('admin');
  // zoom controls
  $('zoom-in').onclick = ()=> { mapState.scale *= 1.1; updateMapTransform(); };
  $('zoom-out').onclick = ()=> { mapState.scale /= 1.1; updateMapTransform(); };
  $('map-reset').onclick = ()=> { mapState = {scale:1,x:0,y:0}; updateMapTransform(); };
  // basic panning
  const wrapper = $('map-wrapper');
  let dragging=false,last={x:0,y:0};
  wrapper.addEventListener('mousedown', (e)=>{ dragging=true; last={x:e.clientX,y:e.clientY}; wrapper.style.cursor='grabbing'; });
  window.addEventListener('mouseup', ()=>{ dragging=false; wrapper.style.cursor='default'; });
  window.addEventListener('mousemove', (e)=>{ if(!dragging) return; mapState.x += e.clientX-last.x; mapState.y += e.clientY-last.y; last={x:e.clientX,y:e.clientY}; updateMapTransform(); });

  function updateMapTransform(){
    const img = $('map-image'); if(!img) return;
    img.style.transform = `translate(${mapState.x}px, ${mapState.y}px) scale(${mapState.scale})`;
    // tokens use percent positions so no transform
  }

})();
