/**
 * Fitopia Gym Manager — Secure Preload Bridge
 * Exposes only a narrow API via contextBridge. Do not expose ipcRenderer.
 */

import { contextBridge, ipcRenderer } from 'electron';

export type ElectronAPI = {
  app: {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
    isPackaged: () => Promise<boolean>;
    getPlatform: () => Promise<NodeJS.Platform>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  shell: {
    openExternal: (url: string) => Promise<boolean>;
  };
  theme: {
    getNativeTheme: () => Promise<{ shouldUseDarkColors: boolean; themeSource: string }>;
  };
};

const electronAPI: ElectronAPI = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  theme: {
    getNativeTheme: () => ipcRenderer.invoke('theme:getNativeTheme'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
