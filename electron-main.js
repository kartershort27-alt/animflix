const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const http  = require('http');
const path  = require('path');

let mainWindow;

// Poll until the Express server is ready, then call cb
function waitForServer(cb) {
  const check = () => {
    http.get('http://localhost:3001', () => cb())
        .on('error', () => setTimeout(check, 150));
  };
  check();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'AniFlix',
    backgroundColor: '#141414',
    autoHideMenuBar: true,
    show: false
  });

  // Only start the Express server if nothing is already on port 3001
  process.env.DATA_DIR = app.getPath('userData');
  http.get('http://localhost:3001', () => {}).on('error', () => require('./server.js'));

  // Load only once the server is actually listening
  waitForServer(() => {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.once('ready-to-show', () => mainWindow.show());
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Auto-updater ─────────────────────────────────────────────────────────────
function setupUpdater() {
  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', info => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `AniFlix ${info.version} is available.\nDownload and install now?`,
      buttons: ['Update', 'Later']
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. Restart now to apply it.',
      buttons: ['Restart', 'Later']
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  // Check silently — no dialog if already up to date
  autoUpdater.checkForUpdates().catch(() => {});
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  // Only check for updates in the packaged app, not during development
  if (app.isPackaged) setupUpdater();
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (!mainWindow) createWindow(); });
