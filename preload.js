const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  sortFolder: (path, options) => ipcRenderer.invoke('sort-folder', path, options),
  undoSort: (path) => ipcRenderer.invoke('undo-sort', path),
  checkBackup: (path) => ipcRenderer.invoke('check-backup', path),
  getRules: () => ipcRenderer.invoke('get-rules'),
  saveRules: (rules) => ipcRenderer.invoke('save-rules', rules),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path) // ✅ Nouveau handler
});
