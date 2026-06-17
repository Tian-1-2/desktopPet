/**
 * main.cjs
 * Electron 主进程：创建透明、无边框、置顶的桌面宠物窗口，管理系统托盘，
 * 并通过 IPC 接收渲染进程的指令（拖拽时移动窗口、隐藏/退出）。
 * 必须是 CommonJS（.cjs）—— 此 Electron 版本以 ESM 作主入口会崩溃。
 */
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

// 开发模式下加载 Vite 本地服务，生产模式加载打包后的 dist/index.html
const isDev = process.env.NODE_ENV === "development";

// 宠物窗口尺寸（正方形）
const PET_W = 220;
const PET_H = 220;

let win = null; // 宠物窗口实例
let tray = null; // 系统托盘实例

// 创建并配置宠物窗口（透明置顶无边框），定位到屏幕右下角并加载页面
function createWindow() {
  win = new BrowserWindow({
    width: PET_W,
    height: PET_H,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");

  // 初始定位到主显示器右下角
  const { workArea } = screen.getPrimaryDisplay();
  const x = workArea.x + workArea.width - PET_W - 20;
  const y = workArea.y + workArea.height - PET_H - 20;
  win.setPosition(Math.round(x), Math.round(y));

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.on("closed", () => {
    win = null;
  });
}

// 加载托盘图标：优先用 assets/tray.png，缺失时回退到内嵌的兜底图标，保证托盘一定能创建
function loadTrayIcon() {
  const iconPath = path.join(__dirname, "assets", "tray.png");
  if (fs.existsSync(iconPath)) {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) return img;
  }
  // 兜底：内嵌一个 16x16 圆点图标，保证托盘一定能创建
  const fallback =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA" +
    "AXNSR0IArs4c6QAAAJZJREFUOI3F0jEKwkAQheFvIxbBwsLCwsLCwsLeA3gAj+ABPIAH8AAe" +
    "wAN4AA9gYWFhYWFhYWFhYWHhCgsLi2yWJWyWBQc/PDDz5s28GZ7lP8oZ3nGOc5xjFznGMc5x" +
    "jFznGMc5xjFznGMc5xjFznGMc5xjFznGMc5xjFznGMc5xjFznGMc5xjFznGMc5xjFznGMc5xj" +
    "FznGMc5xjFznGMc5xjFznGMc5xjFznGMc5xjFznGMc5xAHQA8q4LpKxw3WMAAAAA" +
    "SUVORK5CYII=";
  return nativeImage.createFromDataURL(fallback);
}

// 构建托盘右键菜单（显示/隐藏宠物、退出），菜单项随窗口可见状态动态变化
function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: win && win.isVisible() ? "隐藏宠物" : "显示宠物",
      click: () => toggleVisible(),
    },
    { type: "separator" },
    { label: "退出", click: () => app.quit() },
  ]);
}

// 重建托盘菜单，使其文案与当前窗口状态保持同步
function refreshTrayMenu() {
  if (tray) tray.setContextMenu(buildTrayMenu());
}

// 切换宠物窗口的显示/隐藏，并刷新托盘菜单文案
function toggleVisible() {
  if (!win) return;
  if (win.isVisible()) win.hide();
  else win.show();
  refreshTrayMenu();
}

// 创建系统托盘：设置图标、提示、右键菜单，左键点击切换显隐
function createTray() {
  tray = new Tray(loadTrayIcon());
  tray.setToolTip("桌面宠物");
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", () => toggleVisible());
}

// ---- IPC：拖拽时渲染进程算位置，主进程执行移动 ----
// 把窗口移到指定的绝对屏幕坐标（左上角）
ipcMain.on("pet:move", (_e, x, y) => {
  if (win) win.setPosition(Math.round(x), Math.round(y));
});

// 返回当前窗口 bounds，供渲染进程计算拖拽起点
ipcMain.handle("pet:getBounds", () => (win ? win.getBounds() : null));

// 处理渲染进程触发的动作：隐藏宠物 / 退出应用
ipcMain.on("pet:action", (_e, name) => {
  if (name === "hide") toggleVisible();
  else if (name === "quit") app.quit();
});

// 应用就绪：去掉默认菜单，创建窗口与托盘；macOS 上点击 Dock 图标时按需重建窗口
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 桌面宠物常驻：关闭所有窗口不退出（通过托盘退出）
app.on("window-all-closed", () => {});
