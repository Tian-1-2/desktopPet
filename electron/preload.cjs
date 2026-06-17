const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});

contextBridge.exposeInMainWorld("petAPI", {
  // 拖拽时把窗口移到绝对屏幕坐标（左上角）
  move: (x, y) => ipcRenderer.send("pet:move", x, y),
  // 当前窗口 bounds { x, y, width, height }
  getBounds: () => ipcRenderer.invoke("pet:getBounds"),
  // 触发主进程动作：hide / quit
  action: (name) => ipcRenderer.send("pet:action", name),
});
