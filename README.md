# 桌面宠物（Desktop Pet）

基于 Vite + Vue 3 + Electron 的桌面宠物：一个透明、无边框、置顶、可拖拽的小窗口，
里面是一只会动的角色，能自动走动 / 切换待机，并带系统托盘控制。

## 运行

```bash
npm install        # 首次
npm run dev        # 开发模式（Vite 热更新 + Electron）
npm run build      # 构建渲染层到 dist/
npm start          # 生产模式运行（加载 dist/index.html）
```

## 项目结构

```
.
├── electron/
│   ├── main.cjs        # 主进程：透明置顶窗口 + 托盘 + IPC（窗口移动）
│   ├── preload.cjs     # contextBridge 暴露 petAPI（move/getBounds/action…）
│   └── assets/tray.png # 托盘图标
├── src/
│   ├── App.vue                     # 根组件：拖拽 + 朝向 + 装配
│   ├── components/PetSprite.vue     # 角色精灵（占位 SVG/CSS 动画）
│   ├── composables/usePetState.js   # 状态机 idle/walk/drag
│   ├── composables/useDrag.js       # 拖拽（算坐标→主进程 setPosition）
│   └── composables/useAutoBehavior.js # 自动走动/待机循环
├── vite.config.js
└── package.json
```

## 功能

- **透明置顶窗口**：`electron/main.cjs` 里 `transparent + frame:false + alwaysOnTop`。
- **拖拽移动**：按住宠物拖动（渲染进程算坐标 → 主进程 `setPosition`）。
- **自动行为**：在「待机 → 随机方向走一段 → 待机」间循环，限制在屏幕工作区内。
- **系统托盘**：右键托盘「显示/隐藏宠物」「暂停/恢复自动行为」「退出」；左键点击托盘切换显隐。
- **右键宠物**：隐藏宠物（可从托盘重新显示）。

## 换成自己的角色（GIF / 序列帧）

当前角色是 `src/components/PetSprite.vue` 里用 SVG/CSS 画的占位猫，开箱即用。
要换成 GIF：

1. 把动画放到 `src/assets/pet/`，例如 `idle.gif`、`walk.gif`、`drag.gif`。
2. 在 `PetSprite.vue` 中把 `<svg>` 换成 `<img>`，按状态切换：

   ```vue
   <script setup>
   import idle from "../assets/pet/idle.gif";
   import walk from "../assets/pet/walk.gif";
   import drag from "../assets/pet/drag.gif";
   import { computed } from "vue";
   const props = defineProps({ state: { type: String, default: "idle" } });
   const src = computed(() => ({ idle, walk, drag }[props.state] || idle));
   </script>
   <template>
     <img :src="src" class="pet-sprite" draggable="false" />
   </template>
   ```

   左右朝向由 `App.vue` 通过 `transform: scaleX(±1)` 自动处理。

托盘图标在 `electron/assets/tray.png`，可直接替换。

## 注意：在受限 / 无显示环境中运行

如果环境里设置了 `ELECTRON_RUN_AS_NODE=1`（部分沙箱 / CI 会设），Electron 会以纯 Node
模式启动、不显示 GUI，且 `require("electron")` 只返回路径字符串导致报错。
普通桌面环境下不会有这个变量，正常 `npm run dev` 即可。需要时手动清除：

```powershell
$env:ELECTRON_RUN_AS_NODE = ""   # PowerShell
```

## 可选增强（尚未实现）

- 点击说话气泡 / 表情；多显示器精确定位；鼠标穿透透明区域；开机自启；
- 用 `electron-builder` 打包为安装包。
