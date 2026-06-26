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

  // 获取实时金价（主进程抓取并缓存）：{ shanghai, comex, ok }
  getGold: () => ipcRenderer.invoke("pet:getGold"),
  // 获取当前视图模式：'pet'（显示宠物）| 'gold'（只显示金价）
  getMode: () => ipcRenderer.invoke("pet:getMode"),
  // 请求主进程切换视图模式（宠物 <-> 金价）
  toggleMode: () => ipcRenderer.send("pet:toggleMode"),
  // 订阅主进程推送的视图模式变化；返回取消订阅函数
  onMode: (cb) => {
    const handler = (_e, mode) => cb(mode);
    ipcRenderer.on("pet:mode", handler);
    return () => ipcRenderer.removeListener("pet:mode", handler);
  },
});
