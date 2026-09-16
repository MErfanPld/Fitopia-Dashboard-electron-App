# Fitopia Gym Manager — Windows Desktop Application

Professional **Fitopia Gym Owner / Gym Manager** desktop application for Windows.

Independent Electron shell around the existing Fitopia Gym Panel React application.  
The original web React repository is **not** modified.

## Architecture

```
React Renderer (existing Gym Panel UI)
        ↓
Secure Preload (contextBridge)
        ↓
Electron Main Process
        ↓
Native Windows APIs
        ↓
Fitopia Django REST API
```

## Requirements

- Node.js 20+
- npm
- Windows host for packaging the installer

## Setup

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + Electron development |
| `npm run lint` | TypeScript check |
| `npm run build` | Production renderer + Electron compile |
| `npm run dist` | Windows NSIS installer → `release/Fitopia-Gym-Manager-Setup.exe` |
| `npm run dist:dir` | Unpackaged app directory |
| `npm run clean` | Remove build artifacts |

## Environment

Optional `.env`:

```env
VITE_API_BASE_URL=https://fitopiaapi.pythonanywhere.com/api
```

Default API is the production Fitopia API. Auth tokens use `localStorage` (same as web).

## Security

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- Preload-only bridge: `window.electronAPI`
- No direct Node or `ipcRenderer` exposure

## Windows packaging

```bash
npm run dist
```

Produces `release/Fitopia-Gym-Manager-Setup.exe` (NSIS).  
Must be run on Windows (or Windows CI) for a reliable installer.

Replace `build/icon.ico` / `build/icon.png` with official Fitopia branding before release.

## Related

- Web panel: https://github.com/MErfanPld/Fitopia-Dashboard-React-App
- This repo: dedicated desktop application
