# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **desktop pet** app: a transparent, frameless, always-on-top Electron window containing an
animated character that auto-wanders, can be dragged, and is controlled from a system tray.
Built with Vite + Vue 3 (renderer) + Electron (main process).

## Commands

```bash
npm install        # first time
npm run dev        # Vite dev server (port 5173, strictPort) + Electron with hot reload
npm run build      # build renderer into dist/
npm start          # run Electron against the production build (NODE_ENV=production)
```

There is **no test suite, linter, or formatter** configured. `npm run build` (a real `vite build`)
is the fastest way to catch compile/import errors in the renderer.

### Launching the GUI in this environment

`ELECTRON_RUN_AS_NODE=1` is set in this sandbox. It forces Electron to run as plain Node (no GUI),
which makes `require("electron")` return a path string and crashes the main process at load. To
actually launch the window, clear it first:

```powershell
$env:ELECTRON_RUN_AS_NODE = ""    # PowerShell
```

Then start Vite and Electron separately (the `concurrently` script competes for port 5173 on
restart if a previous dev server is still listening — kill the PID on 5173 before relaunching).
A normal end-user machine does not have this variable, so plain `npm run dev` works there.

## Architecture

The defining design decision: **all window movement happens in the main process; the renderer only
computes coordinates.** Both dragging and auto-walking call `petAPI.move(x, y)` →
`ipcMain.on("pet:move")` → `win.setPosition()`. CSS `-webkit-app-region: drag` is deliberately NOT
used (it swallows clicks and conflicts with programmatic auto-walk movement).

- **`electron/main.cjs`** — owns window shape (transparent/frameless/alwaysOnTop/skipTaskbar),
  the `Tray` + its context menu, and the IPC handlers (`pet:move`, `pet:getBounds`,
  `pet:getWorkArea`, `pet:action`). Tray "pause auto" pushes a `pet:command` message *down* to the
  renderer. `window-all-closed` is intentionally a no-op so the app stays resident in the tray.
- **`electron/preload.cjs`** — `contextBridge` exposes `petAPI` (move / getBounds / getWorkArea /
  action / onCommand) under `contextIsolation: true`. The renderer never touches Node/Electron
  directly; add any new main↔renderer capability here.
- **`src/App.vue`** — wires the pieces: composes the state machine, drag, and auto-behavior, and
  applies `transform: scaleX(±1)` for left/right facing.
- **`src/composables/`** — `usePetState` (idle/walk/drag state + facing), `useDrag` (mouse
  `screenX/screenY` → new window top-left → `petAPI.move`), `useAutoBehavior` (rAF loop cycling
  idle→walk→idle, clamped to `petAPI.getWorkArea()` so the pet never leaves the screen; obeys the
  tray pause command and skips moving while dragging).
- **`src/components/PetSprite.vue`** — the visual character. Currently a placeholder SVG/CSS
  animation driven by the `state` prop. Swapping to GIFs (the intended asset format) means
  replacing the `<svg>` with a `<img :src>` that maps state→file; facing is handled by the parent,
  not here. See README for the snippet.

### Module-system split (important)

`package.json` has `"type": "module"`, so files under `src/` are ESM (bundled by Vite). The
**Electron main and preload must be CommonJS** (`.cjs`) — an ESM main entry crashes this Electron
version's module loader. `package.json:main` points at `electron/main.cjs`. Keep main/preload as
`.cjs` and `require()`-based.

### Vite config notes

`vite.config.js` sets `root: "src"`, `outDir: "../dist"`, and `base: "./"` — the relative base is
required so the built `index.html` loads its assets over `file://` in production Electron.

### 添加代码
添加代码时注意要给每个函数上方增加注释介绍当前函数的作用，每个新增文件最上方添加注释介绍当前文件是做什么的
