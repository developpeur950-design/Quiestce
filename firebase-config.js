// =============================================================
// firebase-config.js — Configuration Firebase + API temps réel
// Remplacez les valeurs par celles de votre projet Firebase
// =============================================================

// ─── CONFIGURATION FIREBASE ───────────────────────────────────
// 1. Allez sur https://console.firebase.google.com
// 2. Créez un projet (ex: "qui-est-ce-chimie")
// 3. Ajoutez une app Web → copiez la config ci-dessous
// 4. Activez "Realtime Database" en mode test (règles ouvertes)

const firebaseConfig = {
  apiKey: "AIzaSyD6sL1joSiMbjTmp_dDOWIW5oTMgH_yz0o",
  authDomain: "qui-est-ce-db75b.firebaseapp.com",
  projectId: "qui-est-ce-db75b",
  storageBucket: "qui-est-ce-db75b.firebasestorage.app",
  messagingSenderId: "856371849515",
  appId: "1:856371849515:web:4f1866fcee4d7d882c7d6e",
  measurementId: "G-K5LQF292NS"
};

// ─── INITIALISATION FIREBASE ──────────────────────────────────
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// =============================================================
// STRUCTURE DE LA BASE DE DONNÉES :
// games/
//   {gameCode}/
//     status:       "waiting" | "choosing" | "playing" | "finished"
//     createdAt:    timestamp
//     currentTurn:  "host" | "guest"
//     turnPhase:    "question" | "answer" | "guess" | "guess-answer" | "finished"
//     winner:       "host" | "guest" | null
//     lastQuestion: { text, key, askedBy }
//     lastAnswer:   { value, answeredBy }
//     lastGuess:    { elementNumber, guessedBy }
//     host/
//       name, elementNumber, ready, rematch
//     guest/
//       name, elementNumber, ready, rematch
//     logs/
//       { type, text, timestamp }
// =============================================================

// ─── UTILITAIRES ──────────────────────────────────────────────

/**
 * Génère un code de partie unique (4 caractères alphanumériques)
 * Exclut les caractères ambigus (0/O, 1/I/L)
 */
function generateGameCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Ajoute une entrée dans le log de la partie
 * @param {string} code - code de la partie
 * @param {string} type - "system" | "question" | "answer" | "guess" | "win" | "miss"
 * @param {string} text - texte du log
 */
async function addLog(code, type, text) {
  const logsRef = db.ref(`games/${code}/logs`);
  await logsRef.push({
    type,
    text,
    timestamp: Date.now()
  });
}

// ─── GESTION DE PARTIE ────────────────────────────────────────

/**
 * Crée une nouvelle partie en tant qu'hôte
 * @param {string} hostName - pseudo de l'hôte
 * @returns {Promise<string>} - code de la partie créée
 */
async function createGame(hostName) {
  let code;
  let attempts = 0;

  // Générer un code unique non encore utilisé
  do {
    code = generateGameCode();
    const snap = await db.ref(`games/${code}`).once("value");
    if (!snap.exists()) break;
    attempts++;
    if (attempts > 10) throw new Error("Impossible de générer un code unique.");
  } while (true);

  // Structure initiale de la partie
  await db.ref(`games/${code}`).set({
    status:       "waiting",
    createdAt:    Date.now(),
    currentTurn:  "host",
    turnPhase:    "question",
    winner:       null,
    lastQuestion: null,
    lastAnswer:   null,
    lastGuess:    null,
    host: {
      name:          hostName,
      elementNumber: null,
      ready:         false,
      rematch:       false,
    },
    guest: {
      name:          null,
      elementNumber: null,
      ready:         false,
      rematch:       false,
    },
    logs: {}
  });

  return code;
}

/**
 * Rejoint une partie existante en tant qu'invité
 * @param {string} code   - code de la partie (insensible à la casse)
 * @param {string} guestName - pseudo de l'invité
 * @returns {Promise<Object>} - données initiales de la partie
 */
async function joinExistingGame(code, guestName) {
  const upperCode = code.toUpperCase().trim();
  const ref = db.ref(`games/${upperCode}`);
  const snap = await ref.once("value");

  // Vérifications
  if (!snap.exists()) {
    throw new Error("Partie introuvable. Vérifiez le code.");
  }

  const data = snap.val();

  if (data.status !== "waiting") {
    throw new Error("Cette partie est déjà en cours ou terminée.");
  }

  if (data.guest && data.guest.name !== null) {
    throw new Error("Cette partie est déjà complète (2 joueurs max).");
  }

  // Enregistrer l'invité et passer au statut "choosing"
  await ref.update({
    status:       "choosing",
    "guest/name": guestName,
  });

  return { code: upperCode, data };
}

// ─── PHASE DE CHOIX ───────────────────────────────────────────

/**
 * Enregistre le choix d'élément d'un joueur
 * Si les deux joueurs ont choisi → démarre la partie
 * @param {string} code          - code de la partie
 * @param {string} role          - "host" ou "guest"
 * @param {number} elementNumber - numéro atomique de l'élément choisi
 */
async function setPlayerElement(code, role, elementNumber) {
  // Sauvegarder le choix du joueur
  await db.ref(`games/${code}/${role}`).update({
    elementNumber: elementNumber,
    ready:         true,
  });

  // Récupérer l'état actuel pour vérifier si les deux sont prêts
  const snap = await db.ref(`games/${code}`).once("value");
  const data = snap.val();

  if (data.host.ready && data.guest.ready) {
    // Les deux joueurs ont choisi → lancer la partie
    await db.ref(`games/${code}`).update({
      status:      "playing",
      currentTurn: "host",
      turnPhase:   "question",
    });
    await addLog(
      code,
      "system",
      `🎮 La partie commence ! ${data.host.name} pose la première question.`
    );
  } else {
    await addLog(
      code,
      "system",
      `✅ ${role === "host" ? data.host.name : data.guest.name} a choisi son élément.`
    );
  }
}

// ─── PHASE DE JEU : QUESTIONS ─────────────────────────────────

/**
 * Envoie une question à l'adversaire
 * @param {string}      code - code de la partie
 * @param {string}      role - rôle du joueur qui pose ("host" | "guest")
 * @param {string}      text - texte affiché de la question
 * @param {string|null} key  - clé pour auto-évaluation (null = question libre)
 */
async function sendQuestionToGame(code, role, text, key = null) {
  await db.ref(`games/${code}`).update({
    lastQuestion: {
      text:     text,
      key:      key,
      askedBy:  role,
    },
    lastAnswer:  null,
    turnPhase:   "answer",
  });
  await addLog(code, "question", `❓ [${role === "host" ? "Hôte" : "Invité"}] ${text}`);
}

/**
 * Répond à la question posée par l'adversaire
 * @param {string}  code  - code de la partie
 * @param {string}  role  - rôle du répondant
 * @param {boolean} value - true = OUI, false = NON
 */
async function answerQuestionInGame(code, role, value) {
  await db.ref(`games/${code}`).update({
    lastAnswer: {
      value:       value,
      answeredBy:  role,
    },
    // On repasse en phase "question" mais c'est le demandeur
    // qui doit d'abord voir la réponse (géré côté client)
    turnPhase: "response",
  });
  await addLog(
    code,
    "answer",
    `💬 Réponse : ${value ? "✅ OUI" : "❌ NON"}`
  );
}

/**
 * Termine le tour après que le demandeur a lu la réponse
 * Passe la main à l'adversaire
 * @param {string} code        - code de la partie
 * @param {string} currentRole - rôle du joueur actuel
 */
async function endTurn(code, currentRole) {
  const nextTurn = currentRole === "host" ? "guest" : "host";
  await db.ref(`games/${code}`).update({
    currentTurn:  nextTurn,
    turnPhase:    "question",
    lastQuestion: null,
    lastAnswer:   null,
  });
}

// ─── PHASE DE JEU : PROPOSITIONS ──────────────────────────────

/**
 * Envoie une proposition d'élément (tentative de deviner)
 * @param {string} code          - code de la partie
 * @param {string} role          - rôle du devineur
 * @param {number} elementNumber - numéro atomique proposé
 */
async function sendGuessToGame(code, role, elementNumber) {
  const el = getElementById(elementNumber);
  await db.ref(`games/${code}`).update({
    lastGuess: {
      elementNumber: elementNumber,
      guessedBy:     role,
    },
    turnPhase: "guess-answer",
  });
  await addLog(
    code,
    "guess",
    `🎯 [${role === "host" ? "Hôte" : "Invité"}] propose : ${el ? el.name : "?"} (${el ? el.symbol : "?"})`
  );
}

/**
 * Répond à une proposition de l'adversaire
 * @param {string}  code        - code de la partie
 * @param {string}  role        - rôle du répondant (celui dont on devine l'élément)
 * @param {boolean} correct     - true = bonne réponse
 * @param {string}  guesserRole - rôle du devineur
 */
async function answerGuessInGame(code, role, correct, guesserRole) {
  if (correct) {
    // ✅ Bonne proposition → le devineur gagne
    await db.ref(`games/${code}`).update({
      winner:    guesserRole,
      status:    "finished",
      turnPhase: "finished",
    });

    // Récupérer les noms pour le log
    const snap = await db.ref(`games/${code}`).once("value");
    const data = snap.val();
    const winnerName = guesserRole === "host" ? data.host.name : data.guest.name;

    await addLog(
      code,
      "win",
      `🏆 ${winnerName} a trouvé l'élément et remporte la partie !`
    );
  } else {
    // ❌ Mauvaise proposition → passer le tour à l'adversaire
    const nextTurn = guesserRole === "host" ? "guest" : "host";

    await db.ref(`games/${code}`).update({
      lastGuess:   null,
      turnPhase:   "question",
      currentTurn: nextTurn,
    });

    await addLog(
      code,
      "miss",
      `❌ Mauvaise proposition ! C'est maintenant au tour de l'adversaire.`
    );
  }
}

// ─── FIN DE PARTIE ────────────────────────────────────────────

/**
 * Signale qu'un joueur veut rejouer
 * Si les deux acceptent → remet la partie à zéro
 * @param {string} code - code de la partie
 * @param {string} role - rôle du joueur ("host" | "guest")
 */
async function requestRematchInGame(code, role) {
  // Marquer ce joueur comme voulant rejouer
  await db.ref(`games/${code}/${role}/rematch`).set(true);

  // Vérifier si les deux joueurs veulent rejouer
  const snap = await db.ref(`games/${code}`).once("value");
  const data = snap.val();

  if (data.host.rematch && data.guest.rematch) {
    // ✅ Les deux veulent rejouer → reset complet sauf les noms
    await db.ref(`games/${code}`).update({
      status:       "choosing",
      currentTurn:  "host",
      turnPhase:    "question",
      winner:       null,
      lastQuestion: null,
      lastAnswer:   null,
      lastGuess:    null,
      // Reset des données joueurs (on garde les noms)
      "host/elementNumber": null,
      "host/ready":         false,
      "host/rematch":       false,
      "guest/elementNumber": null,
      "guest/ready":         false,
      "guest/rematch":       false,
      logs: {}
    });

    // Nouveau log d'accueil
    const hostName  = data.host.name;
    const guestName = data.guest.name;
    await addLog(
      code,
      "system",
      `🔄 Nouvelle partie ! ${hostName} et ${guestName} choisissent leurs éléments...`
    );
  }
}

// ─── ÉCOUTE TEMPS RÉEL ────────────────────────────────────────

/**
 * Écoute les changements d'une partie en temps réel
 * @param {string}   code     - code de la partie
 * @param {function} callback - appelée à chaque changement avec les données
 * @returns {function} - fonction pour stopper l'écoute (unsubscribe)
 */
function listenToGame(code, callback) {
  const ref = db.ref(`games/${code}`);

  ref.on("value", (snap) => {
    if (snap.exists()) {
      callback(snap.val());
    }
  });

  // Retourne une fonction de nettoyage
  return () => ref.off("value");
}

/**
 * Écoute uniquement les logs (optimisation pour le chat/historique)
 * @param {string}   code     - code de la partie
 * @param {function} callback - appelée à chaque nouveau log
 * @returns {function} - fonction pour stopper l'écoute
 */
function listenToLogs(code, callback) {
  const ref = db.ref(`games/${code}/logs`);

  ref.on("child_added", (snap) => {
    if (snap.exists()) {
      callback(snap.val());
    }
  });

  return () => ref.off("child_added");
}

// ─── NETTOYAGE ────────────────────────────────────────────────

/**
 * Supprime les parties datant de plus de 2 heures
 * Appelez cette fonction au démarrage (optionnel)
 */
async function cleanOldGames() {
  try {
    const cutoff = Date.now() - (2 * 60 * 60 * 1000); // 2h
    const snap = await db.ref("games")
      .orderByChild("createdAt")
      .endAt(cutoff)
      .once("value");

    if (snap.exists()) {
      const updates = {};
      snap.forEach((child) => {
        updates[child.key] = null; // null = suppression dans Firebase
      });
      await db.ref("games").update(updates);
      console.log(`🧹 ${Object.keys(updates).length} ancienne(s) partie(s) supprimée(s).`);
    }
  } catch (e) {
    console.warn("Nettoyage des parties échoué :", e);
  }
}
