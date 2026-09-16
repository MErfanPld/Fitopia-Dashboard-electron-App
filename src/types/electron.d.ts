/**
 * Type definitions for the secure Electron preload bridge.
 */

export interface ElectronAPI {
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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
