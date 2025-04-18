const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const nautilus = require('./utils/nautilus');
const configPath = path.join(__dirname, 'config', 'config.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(createWindow);

// === IPC HANDLERS ===

ipcMain.handle('choose-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('sort-folder', async (event, folderPath, options) => {
  try {
    if (!folderPath || isPathDangerous(folderPath)) {
      return { success: false, message: "Ce dossier est protégé ou invalide." };
    }

    if (options.backupEnabled) {
      const backupPath = getBackupPath(folderPath);
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      copyRecursive(folderPath, backupPath);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    await nautilus.sort(folderPath, config.rules);

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('undo-sort', async (event, folderPath) => {
  try {
    const backupPath = getBackupPath(folderPath);
    if (!fs.existsSync(backupPath)) {
      return { success: false, message: "Aucune sauvegarde trouvée." };
    }

    // Supprimer uniquement le contenu du dossier original
    for (const item of fs.readdirSync(folderPath)) {
      const itemPath = path.join(folderPath, item);
      fs.rmSync(itemPath, { recursive: true, force: true });
    }

    // Restaurer depuis le backup
    copyRecursive(backupPath, folderPath);

    // Supprimer le dossier backup
    fs.rmSync(backupPath, { recursive: true, force: true });

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('check-backup', async (event, folderPath) => {
  const backupPath = getBackupPath(folderPath);
  return fs.existsSync(backupPath);
});

ipcMain.handle('get-rules', async () => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.rules;
});

ipcMain.handle('save-rules', async (event, newRules) => {
  const config = { rules: newRules };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return true;
});

// === HELPERS ===

function getBackupPath(originalPath) {
  const hash = Buffer.from(originalPath).toString('base64').replace(/[/+=]/g, '');
  return path.join(os.tmpdir(), `.nautilus_backup_${hash}`);
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function isPathDangerous(folderPath) {
  const normalized = path.resolve(folderPath).toLowerCase();

  const forbiddenPaths = [
    '/',                // racine Linux/Mac
    'c:\\',             // racine Windows
    'c:\\windows',
    'c:\\program files',
    '/system',
    '/bin',
    '/usr',
    '/etc',
  ].map(p => path.resolve(p).toLowerCase());

  return forbiddenPaths.includes(normalized);
}
