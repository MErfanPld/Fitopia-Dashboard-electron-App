/**
 * Fitopia Gym Manager — Electron Main Process
 * Secure desktop shell around the existing React Gym Panel.
 */

import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Menu,
  nativeTheme,
} from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const APP_NAME = 'Fitopia Gym Manager';
const APP_ID = 'com.fitopia.gymmanager';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

function getIndexUrl(): string {
  if (isDev) {
    return process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:3000';
  }
  return `file://${path.join(__dirname, '../dist/index.html')}`;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: APP_NAME,
    show: false,
    backgroundColor: '#08090B',
    autoHideMenuBar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  const url = getIndexUrl();
  mainWindow.loadURL(url).catch((err) => {
    console.error('[main] Failed to load URL:', url, err);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith('https:') || target.startsWith('http:')) {
      shell.openExternal(target);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navUrl) => {
    const allowed = isDev
      ? navUrl.startsWith('http://127.0.0.1:3000') || navUrl.startsWith('http://localhost:3000')
      : navUrl.startsWith('file://');
    if (!allowed) {
      event.preventDefault();
      if (navUrl.startsWith('https:') || navUrl.startsWith('http:')) {
        shell.openExternal(navUrl);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: APP_NAME,
      submenu: [
        { role: 'about', label: `درباره ${APP_NAME}` },
        { type: 'separator' },
        { role: 'quit', label: 'خروج' },
      ],
    },
    {
      label: 'ویرایش',
      submenu: [
        { role: 'undo', label: 'واگرد' },
        { role: 'redo', label: 'ازنو' },
        { type: 'separator' },
        { role: 'cut', label: 'برش' },
        { role: 'copy', label: 'کپی' },
        { role: 'paste', label: 'چسباندن' },
        { role: 'selectAll', label: 'انتخاب همه' },
      ],
    },
    {
      label: 'نمایش',
      submenu: [
        { role: 'reload', label: 'بارگذاری مجدد' },
        { role: 'forceReload', label: 'بارگذاری اجباری' },
        { role: 'toggleDevTools', label: 'ابزار توسعه‌دهنده' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'اندازه واقعی' },
        { role: 'zoomIn', label: 'بزرگ‌نمایی' },
        { role: 'zoomOut', label: 'کوچک‌نمایی' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'تمام‌صفحه' },
      ],
    },
    {
      label: 'پنجره',
      submenu: [
        { role: 'minimize', label: 'کوچک کردن' },
        { role: 'zoom', label: 'بزرگ کردن' },
        { type: 'separator' },
        { role: 'close', label: 'بستن' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpcHandlers(): void {
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getName', () => APP_NAME);
  ipcMain.handle('app:isPackaged', () => app.isPackaged);
  ipcMain.handle('app:getPlatform', () => process.platform);

  ipcMain.handle('window:minimize', () => { mainWindow?.minimize(); });
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window:close', () => { mainWindow?.close(); });
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle('theme:getNativeTheme', () => ({
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    themeSource: nativeTheme.themeSource,
  }));
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId(APP_ID);
  }
  registerIpcHandlers();
  createAppMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (e) => e.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});
