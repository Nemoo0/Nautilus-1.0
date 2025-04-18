# 🧭 Nautilus

**Nautilus** est une application de tri de fichiers automatique, multiplateforme, développée avec Electron.js.  
L'utilisateur peut lancer un tri intelligent dans son dossier Téléchargements ou n'importe quel autre dossier, selon des règles entièrement personnalisables.

---

## 🚀 Fonctionnalités

- Tri par **extension** ou **mots-clés** dans le nom de fichier
- Règles personnalisables via un fichier `config.json`
- Interface utilisateur fidèle à la maquette Figma
- Compatible Windows / macOS / Linux
- **Aucune dépendance système** comme PHP nécessaire

---

## 📁 Structure du projet

nautilus-app/
├── main.js           # Processus principal Electron
├── preload.js        # Bridge sécurisé Node <-> Frontend
├── src/
│   ├── index.html    # Interface utilisateur 
│   ├── renderer.js   # Logique UI et communication IPC
│   └── style.css     # Feuille de style CSS
├── utils/
│   └── nautilus.js   # Moteur de tri
├── config/
│   └── config.json   # Règles de tri personnalisables
├── assets/
│   └── icon.png      # Icône
├── package.json      # Dépendances et configuration
└── README.md         # Documentation
