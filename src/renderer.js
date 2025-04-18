const folderPathInput = document.getElementById('folder-path');
const chooseFolderBtn = document.getElementById('choose-folder');
const openFolderBtn = document.getElementById('open-folder');
const sortBtn = document.getElementById('sort-btn');
const undoBtn = document.getElementById('undo-btn');
const rulesContainer = document.getElementById('rules-container');
const addRuleBtn = document.getElementById('add-rule');
const backupCheckbox = document.getElementById('enable-backup');

let currentFolder = null;
let currentRules = [];

// === Dossier à trier ===

chooseFolderBtn.addEventListener('click', async () => {
  const selectedPath = await window.electronAPI.chooseFolder();
  if (selectedPath) {
    currentFolder = selectedPath;
    folderPathInput.value = selectedPath;

    openFolderBtn.style.display = 'inline-block';

    const hasBackup = await window.electronAPI.checkBackup(selectedPath);
    updateUndoButtonVisibility(hasBackup);
  }
});

openFolderBtn.addEventListener('click', async () => {
  if (currentFolder) {
    await window.electronAPI.openFolder(currentFolder);
  }
});

// === Lancer le tri ===

sortBtn.addEventListener('click', async () => {
  if (!currentFolder) {
    alert("Veuillez d'abord choisir un dossier.");
    return;
  }

  const result = await window.electronAPI.sortFolder(currentFolder, {
    backupEnabled: backupCheckbox.checked
  });

  if (result.success) {
    alert("✅ Tri terminé !");
    const hasBackup = await window.electronAPI.checkBackup(currentFolder);
    updateUndoButtonVisibility(hasBackup);
  } else {
    alert("❌ Erreur : " + result.message);
  }
});

// === Annuler le tri ===

undoBtn.addEventListener('click', async () => {
  if (!currentFolder) return;

  const result = await window.electronAPI.undoSort(currentFolder);
  if (result.success) {
    alert("♻️ Tri annulé et restauration terminée !");
    updateUndoButtonVisibility(false);
  } else {
    alert("❌ Échec de l'annulation : " + result.message);
  }
});

// === Sauvegarde : masquer ou afficher bouton Undo ===

backupCheckbox.addEventListener('change', () => {
  updateUndoButtonVisibility();
});

function updateUndoButtonVisibility(forceEnabled = null) {
  const shouldShow = backupCheckbox.checked && (forceEnabled !== false);
  undoBtn.style.display = shouldShow ? 'inline-block' : 'none';
  if (typeof forceEnabled === 'boolean') {
    undoBtn.disabled = !forceEnabled;
  }
}

// === Règles de tri ===

function createRuleElement(rule, index) {
  const div = document.createElement('div');
  div.classList.add('rule');

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Nom de la catégorie';
  nameInput.value = rule.name || '';
  nameInput.classList.add('rule-name');

  const extInput = document.createElement('input');
  extInput.type = 'text';
  extInput.placeholder = 'Extensions (.jpg, .png...)';
  extInput.value = (rule.extensions || []).join(', ');
  extInput.classList.add('rule-ext');

  const keywordInput = document.createElement('input');
  keywordInput.type = 'text';
  keywordInput.placeholder = 'Mots-clés (facultatif)';
  keywordInput.value = (rule.keywords || []).join(', ');
  keywordInput.classList.add('rule-keywords');

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️';
  deleteBtn.classList.add('delete-rule');
  deleteBtn.onclick = () => {
    currentRules.splice(index, 1);
    renderRules();
    saveRules();
  };

  div.appendChild(nameInput);
  div.appendChild(extInput);
  div.appendChild(keywordInput);
  div.appendChild(deleteBtn);

  nameInput.addEventListener('input', () => updateRule(index));
  extInput.addEventListener('input', () => updateRule(index));
  keywordInput.addEventListener('input', () => updateRule(index));

  return div;
}

function updateRule(index) {
  const ruleDiv = rulesContainer.children[index];
  const name = ruleDiv.querySelector('.rule-name').value.trim();
  const extensions = ruleDiv.querySelector('.rule-ext').value.split(',').map(e => e.trim()).filter(e => e);
  const keywords = ruleDiv.querySelector('.rule-keywords').value.split(',').map(k => k.trim()).filter(k => k);

  currentRules[index] = { name, extensions, keywords };
  saveRules();
}

function renderRules() {
  rulesContainer.innerHTML = '';
  currentRules.forEach((rule, idx) => {
    rulesContainer.appendChild(createRuleElement(rule, idx));
  });
}

addRuleBtn.addEventListener('click', () => {
  currentRules.push({ name: '', extensions: [], keywords: [] });
  renderRules();
  saveRules();
});

async function saveRules() {
  await window.electronAPI.saveRules(currentRules);
}

// === Initialisation ===

async function init() {
  currentRules = await window.electronAPI.getRules();
  renderRules();
  updateUndoButtonVisibility(false); // Masqué au début
}

init();
