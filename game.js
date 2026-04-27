// =============================================================
// game.js — Logique principale du jeu (frontend)
// Gère les écrans, les événements, l'interface et Firebase
// =============================================================

// ─── ÉTAT GLOBAL ──────────────────────────────────────────────
const STATE = {
  gameCode:       null,   // Code de la partie en cours
  myRole:         null,   // "host" ou "guest"
  myName:         null,   // Pseudo du joueur local
  myElement:      null,   // Élément secret choisi (objet)
  oppElement:     null,   // Élément adverse (révélé en fin de partie)
  selectedElement: null,  // Élément survollé/sélectionné pendant le choix
  unsubscribe:    null,   // Fonction pour stopper l'écoute Firebase
  lastGameData:   null,   // Dernier snapshot Firebase
  activeFilter:   null,   // Filtre de catégorie actif sur le tableau
};

// ─── NAVIGATION ENTRE ÉCRANS ──────────────────────────────────

/**
 * Affiche un écran et masque tous les autres
 * @param {string} screenId - ID de l'écran à afficher
 */
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
    // Animation d'entrée
    target.style.opacity = "0";
    requestAnimationFrame(() => {
      target.style.transition = "opacity 0.3s ease";
      target.style.opacity = "1";
    });
  }
}

/**
 * Affiche une notification temporaire
 * @param {string} msg   - Message à afficher
 * @param {string} type  - "info" | "success" | "error"
 * @param {number} delay - Durée en ms (défaut : 3000)
 */
function showNotification(msg, type = "info", delay = 3000) {
  const el = document.getElementById("notification");
  el.textContent = msg;
  el.className = `notification show ${type}`;
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => {
    el.className = "notification hidden";
  }, delay);
}

// ─── ÉCRAN : HÉBERGER UNE PARTIE ──────────────────────────────

/**
 * Crée une nouvelle partie en tant qu'hôte
 * Appelé par le bouton "Créer la partie"
 */
async function hostGame() {
  const nameInput = document.getElementById("host-name");
  const name = nameInput.value.trim();

  if (!name) {
    showNotification("Veuillez entrer un pseudo !", "error");
    nameInput.focus();
    return;
  }

  try {
    // Désactiver le bouton pendant la requête
    const btn = document.querySelector("#host-form .btn");
    btn.disabled = true;
    btn.textContent = "Création...";

    const code = await createGame(name);

    // Mettre à jour l'état
    STATE.gameCode = code;
    STATE.myRole   = "host";
    STATE.myName   = name;

    // Afficher le code généré
    document.getElementById("display-code").textContent = code;
    document.getElementById("host-form").classList.add("hidden");
    document.getElementById("host-waiting").classList.remove("hidden");

    // Nettoyer les vieilles parties
    cleanOldGames();

    // Écouter la partie pour détecter quand un joueur rejoint
    STATE.unsubscribe = listenToGame(code, onGameUpdate);

    showNotification(`Partie créée ! Code : ${code}`, "success");

  } catch (err) {
    showNotification(err.message, "error");
    const btn = document.querySelector("#host-form .btn");
    btn.disabled = false;
    btn.textContent = "Créer la partie";
  }
}

/**
 * Copie le code de la partie dans le presse-papier
 */
function copyCode() {
  const code = STATE.gameCode;
  if (!code) return;
  navigator.clipboard.writeText(code)
    .then(() => showNotification("Code copié !", "success"))
    .catch(() => showNotification(`Code : ${code}`, "info"));
}

// ─── ÉCRAN : REJOINDRE UNE PARTIE ─────────────────────────────

/**
 * Rejoint une partie existante via un code
 * Appelé par le bouton "Rejoindre"
 */
async function joinGame() {
  const nameInput = document.getElementById("join-name");
  const codeInput = document.getElementById("join-code");
  const errorDiv  = document.getElementById("join-error");
  const name = nameInput.value.trim();
  const code = codeInput.value.trim().toUpperCase();

  errorDiv.classList.add("hidden");

  if (!name) {
    showNotification("Veuillez entrer un pseudo !", "error");
    nameInput.focus();
    return;
  }

  if (!code || code.length < 4) {
    showNotification("Veuillez entrer un code valide (4 caractères).", "error");
    codeInput.focus();
    return;
  }

  try {
    const btn = document.querySelector("#screen-join .btn");
    btn.disabled = true;
    btn.textContent = "Connexion...";

    const { code: validCode } = await joinExistingGame(code, name);

    // Mettre à jour l'état
    STATE.gameCode = validCode;
    STATE.myRole   = "guest";
    STATE.myName   = name;

    // Écouter la partie
    STATE.unsubscribe = listenToGame(validCode, onGameUpdate);

    showNotification("Partie rejointe !", "success");

  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove("hidden");
    const btn = document.querySelector("#screen-join .btn");
    btn.disabled = false;
    btn.textContent = "Rejoindre";
  }
}

// ─── ÉCRAN : CHOIX DE L'ÉLÉMENT ───────────────────────────────

/**
 * Construit le tableau périodique de sélection
 * Appelé lors de la transition vers l'écran de choix
 */
function buildChooseTable() {
  const container  = document.getElementById("choose-table");
  const filterArea = document.getElementById("category-filters");
  container.innerHTML  = "";
  filterArea.innerHTML = "";

  // ── Boutons de filtre par catégorie ──
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.textContent = "Tous";
  allBtn.onclick = () => filterCategory(null, allBtn);
  filterArea.appendChild(allBtn);

  Object.entries(CATEGORY_COLORS).forEach(([key, val]) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = val.label;
    btn.style.borderColor = val.bg;
    btn.style.color = val.bg;
    btn.onclick = () => filterCategory(key, btn);
    filterArea.appendChild(btn);
  });

  // ── Grille du tableau périodique ──
  // Le tableau utilise une grille CSS 18 colonnes × 9 lignes
  ELEMENTS.forEach(el => {
    const tile = createElementTile(el, "choose");
    container.appendChild(tile);
  });
}

/**
 * Crée une tuile d'élément cliquable
 * @param {Object} el   - données de l'élément
 * @param {string} mode - "choose" | "game"
 */
function createElementTile(el, mode) {
  const color = CATEGORY_COLORS[el.category] || { bg: "#555", text: "#fff" };
  const tile  = document.createElement("div");

  tile.className   = "element-tile";
  tile.id          = `tile-${mode}-${el.number}`;
  tile.dataset.num = el.number;
  tile.dataset.cat = el.category;
  tile.style.cssText = `
    background: ${color.bg};
    color: ${color.text};
    grid-row: ${el.row};
    grid-column: ${el.col};
  `;

  tile.innerHTML = `
    <span class="tile-number">${el.number}</span>
    <span class="tile-symbol">${el.symbol}</span>
    <span class="tile-name">${el.name}</span>
    <span class="tile-mass">${parseFloat(el.mass).toFixed(1)}</span>
  `;

  // Tooltip au survol
  tile.title = `${el.name} (${el.symbol}) — ${CATEGORY_COLORS[el.category]?.label || el.category} — ${el.state} — Période ${el.period}`;

  if (mode === "choose") {
    tile.onclick = () => selectElement(el);
  } else if (mode === "game") {
    tile.onclick = () => toggleElementTile(el.number);
  }

  return tile;
}

/**
 * Sélectionne un élément dans l'écran de choix
 * @param {Object} el - élément sélectionné
 */
function selectElement(el) {
  // Retirer la sélection précédente
  document.querySelectorAll("#choose-table .element-tile").forEach(t => {
    t.classList.remove("selected");
  });

  // Marquer le nouveau
  const tile = document.getElementById(`tile-choose-${el.number}`);
  if (tile) tile.classList.add("selected");

  STATE.selectedElement = el;

  // Afficher le panneau de confirmation
  document.getElementById("selected-name").textContent =
    `${el.name} (${el.symbol}) — N°${el.number}`;
  document.getElementById("choose-selected").classList.remove("hidden");
}

/**
 * Filtre les éléments affichés par catégorie
 * @param {string|null} category - catégorie à filtrer (null = tout afficher)
 * @param {HTMLElement} btn      - bouton cliqué
 */
function filterCategory(category, btn) {
  STATE.activeFilter = category;

  // Mettre à jour les boutons
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  // Filtrer les tuiles
  document.querySelectorAll("#choose-table .element-tile").forEach(tile => {
    if (!category || tile.dataset.cat === category) {
      tile.style.opacity = "1";
      tile.style.pointerEvents = "auto";
    } else {
      tile.style.opacity = "0.15";
      tile.style.pointerEvents = "none";
    }
  });
}

/**
 * Confirme le choix de l'élément secret
 * Envoie le choix à Firebase
 */
async function confirmChoice() {
  if (!STATE.selectedElement) {
    showNotification("Veuillez d'abord sélectionner un élément !", "error");
    return;
  }

  const el = STATE.selectedElement;
  STATE.myElement = el;

  // Masquer la sélection, afficher l'attente
  document.getElementById("choose-selected").classList.add("hidden");
  document.getElementById("choose-waiting").classList.remove("hidden");

  // Désactiver les tuiles
  document.querySelectorAll("#choose-table .element-tile").forEach(t => {
    t.style.pointerEvents = "none";
    t.style.opacity = t.dataset.num == el.number ? "1" : "0.4";
  });

  try {
    await setPlayerElement(STATE.gameCode, STATE.myRole, el.number);
  } catch (err) {
    showNotification("Erreur lors de la confirmation : " + err.message, "error");
  }
}

// ─── ÉCRAN DE JEU PRINCIPAL ───────────────────────────────────

/**
 * Initialise l'écran de jeu
 * Construit le tableau périodique jouable + les sélecteurs
 */
function initGameScreen(gameData) {
  // Badge de mon élément
  document.getElementById("my-element-badge").innerHTML =
    renderElementBadge(STATE.myElement);

  // Construire le tableau de jeu
  buildGameTable();

  // Remplir le sélecteur de devinette
  buildGuessSelect();

  // Construire les boutons de questions rapides
  buildQuickQuestions();

  // Mettre à jour les noms
  document.getElementById("score-p1").textContent =
    `🏠 ${gameData.host.name}`;
  document.getElementById("score-p2").textContent =
    `👤 ${gameData.guest.name}`;
}

/**
 * Construit le tableau périodique de jeu (avec fonction "coucher")
 */
function buildGameTable() {
  const container = document.getElementById("game-table");
  container.innerHTML = "";
  ELEMENTS.forEach(el => {
    const tile = createElementTile(el, "game");
    container.appendChild(tile);
  });
}

/**
 * Coche/décoche (couche) une tuile du tableau de jeu
 * @param {number} number - numéro atomique de l'élément
 */
function toggleElementTile(number) {
  const tile = document.getElementById(`tile-game-${number}`);
  if (!tile) return;

  tile.classList.toggle("eliminated");

  // Feedback visuel
  if (tile.classList.contains("eliminated")) {
    showNotification(`${getElementById(number)?.name} éliminé`, "info", 1200);
  }
}

/**
 * Construit le sélecteur de devinette (liste déroulante)
 */
function buildGuessSelect() {
  const select = document.getElementById("guess-select");
  select.innerHTML = '<option value="">-- Choisir un élément --</option>';

  // Trier par numéro atomique
  [...ELEMENTS].sort((a, b) => a.number - b.number).forEach(el => {
    const option = document.createElement("option");
    option.value = el.number;
    option.textContent = `${el.number}. ${el.name} (${el.symbol})`;
    select.appendChild(option);
  });
}

/**
 * Construit les boutons de questions rapides
 */
function buildQuickQuestions() {
  const container = document.getElementById("quick-questions");
  container.innerHTML = "";

  QUICK_QUESTIONS.forEach(q => {
    const btn = document.createElement("button");
    btn.className = "quick-q-btn";
    btn.textContent = q.text;
    btn.onclick = () => askQuickQuestion(q.text, q.key);
    container.appendChild(btn);
  });
}

// ─── ACTIONS DU JEU ───────────────────────────────────────────

/**
 * Envoie une question rapide (avec clé d'auto-évaluation)
 * @param {string} text - texte de la question
 * @param {string} key  - clé pour auto-évaluation
 */
async function askQuickQuestion(text, key) {
  if (!isMyTurn()) {
    showNotification("Ce n'est pas votre tour !", "error");
    return;
  }
  if (!isInPhase("question")) {
    showNotification("Vous ne pouvez pas poser de question maintenant.", "error");
    return;
  }

  try {
    await sendQuestionToGame(STATE.gameCode, STATE.myRole, text, key);
    showActionPanel("panel-wait");
    document.getElementById("wait-message").textContent =
      "En attente de la réponse de l'adversaire...";
  } catch (err) {
    showNotification("Erreur : " + err.message, "error");
  }
}

/**
 * Envoie une question personnalisée (texte libre)
 */
async function sendQuestion() {
  if (!isMyTurn()) {
    showNotification("Ce n'est pas votre tour !", "error");
    return;
  }
  if (!isInPhase("question")) {
    showNotification("Vous ne pouvez pas poser de question maintenant.", "error");
    return;
  }

  const textarea = document.getElementById("custom-question");
  const text = textarea.value.trim();

  if (!text) {
    showNotification("Veuillez écrire votre question.", "error");
    textarea.focus();
    return;
  }

  try {
    // null = question libre, réponse manuelle obligatoire
    await sendQuestionToGame(STATE.gameCode, STATE.myRole, text, null);
    textarea.value = "";
    showActionPanel("panel-wait");
    document.getElementById("wait-message").textContent =
      "En attente de la réponse de l'adversaire...";
  } catch (err) {
    showNotification("Erreur : " + err.message, "error");
  }
}

/**
 * Envoie une réponse (OUI/NON) à la question de l'adversaire
 * @param {boolean} value - true = OUI, false = NON
 */
async function sendAnswer(value) {
  try {
    await answerQuestionInGame(STATE.gameCode, STATE.myRole, value);
    showActionPanel("panel-wait");
    document.getElementById("wait-message").textContent =
      "Réponse envoyée. En attente du prochain tour...";
  } catch (err) {
    showNotification("Erreur : " + err.message, "error");
  }
}

/**
 * Envoie une proposition d'élément
 */
async function sendGuess() {
  if (!isMyTurn()) {
    showNotification("Ce n'est pas votre tour !", "error");
    return;
  }
  if (!isInPhase("question")) {
    showNotification("Vous ne pouvez pas proposer maintenant.", "error");
    return;
  }

  const select = document.getElementById("guess-select");
  const number = parseInt(select.value);

  if (!number) {
    showNotification("Veuillez sélectionner un élément à proposer.", "error");
    select.focus();
    return;
  }

  // Confirmation
  const el = getElementById(number);
  if (!confirm(`Proposer "${el?.name}" ? Une mauvaise réponse vous fera perdre votre tour !`)) return;

  try {
    await sendGuessToGame(STATE.gameCode, STATE.myRole, number);
    showActionPanel("panel-wait");
    document.getElementById("wait-message").textContent =
      "Proposition envoyée. En attente de la réponse...";
  } catch (err) {
    showNotification("Erreur : " + err.message, "error");
  }
}

/**
 * Répond à une proposition de l'adversaire (OUI = correct / NON = incorrect)
 * @param {boolean} correct
 */
async function answerGuess(correct) {
  try {
    const guessData = STATE.lastGameData?.lastGuess;
    if (!guessData) return;

    await answerGuessInGame(
      STATE.gameCode,
      STATE.myRole,
      correct,
      guessData.guessedBy
    );
  } catch (err) {
    showNotification("Erreur : " + err.message, "error");
  }
}

/**
 * Appelé après que le joueur a lu la réponse reçue
 * Passe au tour suivant
 */
async function acknowledgeResponse() {
  try {
    await endTurn(STATE.gameCode, STATE.myRole);
  } catch (err) {
    showNotification("Erreur : " + err.message, "error");
  }
}

// ─── MISE À JOUR DE L'INTERFACE ───────────────────────────────

/**
 * Callback principal appelé à chaque changement Firebase
 * C'est ici que tout l'état du jeu est synchronisé
 * @param {Object} data - données complètes de la partie
 */
function onGameUpdate(data) {
  if (!data) return;
  STATE.lastGameData = data;

  const { status, currentTurn, turnPhase, lastQuestion,
          lastAnswer, lastGuess, winner, host, guest } = data;

  // ── Transition de statut ──────────────────────────────────
  switch (status) {

    case "waiting":
      // L'hôte attend l'invité → déjà géré dans screen-host
      break;

    case "choosing":
      // Un joueur a rejoint → les deux doivent choisir leur élément
      if (document.getElementById("screen-host").classList.contains("active") ||
          document.getElementById("screen-join").classList.contains("active")) {
        buildChooseTable();
        showScreen("screen-choose");
        document.getElementById("choose-subtitle").textContent =
          guest.name
            ? `${guest.name} a rejoint ! Choisissez votre élément secret.`
            : "Choisissez votre élément secret.";
      }
      break;

    case "playing":
      // Démarrage ou mise à jour du jeu
      if (!document.getElementById("screen-game").classList.contains("active")) {
        initGameScreen(data);
        showScreen("screen-game");
      }
      updateGameUI(data);
      break;

    case "finished":
      // Fin de partie
      if (document.getElementById("screen-game").classList.contains("active") ||
          !document.getElementById("screen-end").classList.contains("active")) {
        showEndScreen(data);
      }
      updateEndRematch(data);
      break;
  }
}

/**
 * Met à jour toute l'interface de jeu selon l'état Firebase
 * @param {Object} data - données Firebase
 */
function updateGameUI(data) {
  const { currentTurn, turnPhase, lastQuestion, lastAnswer, lastGuess, host, guest } = data;

  const iAmCurrent  = (currentTurn === STATE.myRole);
  const oppRole     = STATE.myRole === "host" ? "guest" : "host";
  const oppName     = oppRole === "host" ? host.name : guest.name;
  const myName      = STATE.myRole === "host" ? host.name : guest.name;

  // ── Barre de statut ──────────────────────────────────────
  const turnEl = document.getElementById("turn-indicator");
  if (iAmCurrent) {
    turnEl.textContent = "🟢 C'est votre tour !";
    turnEl.className   = "turn-indicator my-turn";
  } else {
    turnEl.textContent = `⏳ Tour de ${oppName}`;
    turnEl.className   = "turn-indicator opp-turn";
  }

  // ── Mise à jour des logs ──────────────────────────────────
  updateLogs(data.logs);

  // ── Logique des panneaux d'action selon la phase ─────────
  switch (turnPhase) {

    case "question":
      // C'est le tour de quelqu'un de poser une question
      if (iAmCurrent) {
        showActionPanel("panel-ask");
      } else {
        showActionPanel("panel-wait");
        document.getElementById("wait-message").textContent =
          `${oppName} prépare sa question...`;
      }
      break;

    case "answer":
      // Une question a été posée → le destinataire doit répondre
      if (lastQuestion) {
        const asker = lastQuestion.askedBy;
        if (asker !== STATE.myRole) {
          // C'est MOI qui dois répondre
          document.getElementById("question-text").innerHTML =
            `<strong>${myName === host.name ? host.name : guest.name}</strong> vous demande :<br>
             <em>"${lastQuestion.text}"</em>`;

          // Auto-évaluation si question rapide
          if (lastQuestion.key !== null && STATE.myElement) {
            const autoAnswer = evaluateQuestion(lastQuestion.key, STATE.myElement);
            if (autoAnswer !== null) {
              // Réponse automatique avec délai court pour que l'adversaire voit
              showActionPanel("panel-answer");
              document.getElementById("question-text").innerHTML +=
                `<br><small style="color:#aaa">(Réponse automatique détectée)</small>`;
              // Petite pause pour laisser le joueur voir avant l'envoi auto
              setTimeout(() => {
                if (STATE.lastGameData?.turnPhase === "answer") {
                  sendAnswer(autoAnswer);
                }
              }, 1500);
            } else {
              showActionPanel("panel-answer");
            }
          } else {
            showActionPanel("panel-answer");
          }
        } else {
          // C'est MOI qui ai posé, j'attends la réponse
          showActionPanel("panel-wait");
          document.getElementById("wait-message").textContent =
            `${oppName} réfléchit à la réponse...`;
        }
      }
      break;

    case "response":
      // La réponse a été donnée → le demandeur doit la voir
      if (lastAnswer && lastQuestion) {
        const asker = lastQuestion.askedBy;
        if (asker === STATE.myRole) {
          // C'est MA réponse reçue
          const answerText = lastAnswer.value
            ? `<span class="yes-answer">✅ OUI</span>`
            : `<span class="no-answer">❌ NON</span>`;
          document.getElementById("response-display").innerHTML =
            `<p>À votre question :<br><em>"${lastQuestion.text}"</em></p>
             <div class="response-value">${answerText}</div>`;
          showActionPanel("panel-response");
        } else {
          showActionPanel("panel-wait");
          document.getElementById("wait-message").textContent =
            `${oppName} lit votre réponse...`;
        }
      }
      break;

    case "guess-answer":
      // Une proposition a été faite
      if (lastGuess) {
        const guesser = lastGuess.guessedBy;
        const guessEl = getElementById(lastGuess.elementNumber);
        if (guesser !== STATE.myRole) {
          // L'adversaire essaie de deviner MON élément
          document.getElementById("guess-display").innerHTML =
            renderElementBadge(guessEl) +
            `<p>Est-ce votre élément secret ?</p>`;
          showActionPanel("panel-guess-received");
        } else {
          // J'attends la réponse à MA proposition
          showActionPanel("panel-wait");
          document.getElementById("wait-message").textContent =
            `${oppName} vérifie votre proposition...`;
        }
      }
      break;
  }
}

/**
 * Met à jour le log de jeu affiché
 * @param {Object|null} logs - objet logs Firebase (clés = push IDs)
 */
function updateLogs(logs) {
  const container = document.getElementById("game-log");
  if (!logs) {
    container.innerHTML = "<p class='log-empty'>Aucune action encore...</p>";
    return;
  }

  // Convertir l'objet Firebase en tableau trié
  const entries = Object.values(logs).sort((a, b) => a.timestamp - b.timestamp);

  container.innerHTML = entries.map(entry => `
    <div class="log-entry log-${entry.type}">
      ${entry.text}
    </div>
  `).join("");

  // Auto-scroll vers le bas
  container.scrollTop = container.scrollHeight;
}

/**
 * Affiche un seul panneau d'action et masque les autres
 * @param {string} panelId - ID du panneau à afficher
 */
function showActionPanel(panelId) {
  const panels = [
    "panel-ask",
    "panel-answer",
    "panel-wait",
    "panel-response",
    "panel-guess-received"
  ];
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("hidden", id !== panelId);
    }
  });
}

// ─── FIN DE PARTIE ────────────────────────────────────────────

/**
 * Affiche l'écran de fin de partie
 * @param {Object} data - données Firebase
 */
function showEndScreen(data) {
  const { winner, host, guest } = data;

  const iWon = winner === STATE.myRole;
  const oppRole = STATE.myRole === "host" ? "guest" : "host";

  // Récupérer les éléments
  const myElementData  = getElementById(
    STATE.myRole === "host" ? host.elementNumber : guest.elementNumber
  );
  const oppElementData = getElementById(
    oppRole === "host" ? host.elementNumber : guest.elementNumber
  );
  STATE.oppElement = oppElementData;

  // Icône et titre
  document.getElementById("end-result-icon").textContent = iWon ? "🏆" : "💀";
  document.getElementById("end-title").textContent =
    iWon ? "Félicitations, vous avez gagné !" : "Vous avez perdu...";
  document.getElementById("end-subtitle").textContent =
    iWon
      ? `Vous avez deviné l'élément de l'adversaire !`
      : `${winner === "host" ? host.name : guest.name} a trouvé votre élément.`;

  // Badges des éléments
  document.getElementById("end-my-element").innerHTML =
    renderElementBadge(myElementData, "large");
  document.getElementById("end-opp-element").innerHTML =
    renderElementBadge(oppElementData, "large");

  showScreen("screen-end");
}

/**
 * Met à jour le statut de revanche affiché
 * @param {Object} data - données Firebase
 */
function updateEndRematch(data) {
  if (!document.getElementById("screen-end").classList.contains("active")) return;

  const { host, guest } = data;
  const myRematch  = STATE.myRole === "host" ? host.rematch : guest.rematch;
  const oppRematch = STATE.myRole === "host" ? guest.rematch : host.rematch;
  const oppName    = STATE.myRole === "host" ? guest.name : host.name;

  let msg = "";
  if (myRematch && !oppRematch) msg = `En attente de ${oppName}...`;
  if (!myRematch && oppRematch) msg = `${oppName} veut rejouer !`;
  if (myRematch && oppRematch)  msg = "Les deux joueurs veulent rejouer !";

  document.getElementById("rematch-status").textContent = msg;
}

/**
 * Demande une revanche
 */
async function requestRematch() {
  try {
    const btn = document.querySelector("#screen-end .btn-primary");
    btn.disabled = true;
    btn.textContent = "En attente...";
    await requestRematchInGame(STATE.gameCode, STATE.myRole);
  } catch (err) {
    showNotification("Erreur : " + err.message, "error");
  }
}

// ─── UTILITAIRES ──────────────────────────────────────────────

/**
 * Vérifie si c'est le tour du joueur local
 */
function isMyTurn() {
  return STATE.lastGameData?.currentTurn === STATE.myRole;
}

/**
 * Vérifie si la phase de jeu correspond
 * @param {string} phase - phase attendue
 */
function isInPhase(phase) {
  return STATE.lastGameData?.turnPhase === phase;
}

// ─── INITIALISATION ───────────────────────────────────────────

// Nettoyage des vieilles parties au chargement
window.addEventListener("load", () => {
  cleanOldGames();
  showScreen("screen-home");
  console.log("🧪 Qui est-ce ? — Éléments Chimiques — Prêt !");
});
