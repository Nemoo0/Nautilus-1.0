const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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

ipcMain.handle('choose-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  if (folderPath && fs.existsSync(folderPath)) {
    await shell.openPath(folderPath);
  }
});

ipcMain.handle('sort-folder', async (event, folderPath, options) => {
  try {
    if (!folderPath || isPathDangerous(folderPath)) {
      return { success: false, message: "Ce dossier est protégé ou invalide." };
    }

    const webContents = event.sender;

    if (options.backupEnabled) {
      const backupPath = getBackupPath(folderPath);
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      copyRecursive(folderPath, backupPath);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    await nautilus.sort(folderPath, config.rules, progress => {
      webContents.send('sort-progress', progress);
    });

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('undo-sort', async (event, folderPath) => {
  try {
    const webContents = event.sender;
    const backupPath = getBackupPath(folderPath);

    if (!fs.existsSync(backupPath)) {
      return { success: false, message: "Aucune sauvegarde trouvée." };
    }

    const items = fs.readdirSync(folderPath);
    const total = items.length;
    let processed = 0;

    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      fs.rmSync(itemPath, { recursive: true, force: true });
      processed++;
      webContents.send('undo-progress', Math.round((processed / total) * 100));
    }

    copyRecursive(backupPath, folderPath);
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
    '/', 'c:\\', 'c:\\windows', 'c:\\program files', '/system', '/bin', '/usr', '/etc'
  ].map(p => path.resolve(p).toLowerCase());

  return forbiddenPaths.includes(normalized);
}
