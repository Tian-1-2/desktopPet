<script setup>
/**
 * App.vue
 * 组合宠物各部分：状态机 + 拖拽，并根据视图模式在「宠物」与「金价面板」之间切换。
 * 视图模式以主进程为单一来源（托盘菜单 / 双击均可切换），主进程通过 onMode 推送变化。
 */
import { ref, onMounted, onUnmounted, watch } from "vue";
import PetSprite from "./components/PetSprite.vue";
import GoldPanel from "./components/GoldPanel.vue";
import { usePetState } from "./composables/usePetState.js";
import { useDrag } from "./composables/useDrag.js";

const { state, setState } = usePetState();

const mode = ref("pet"); // 'pet' 显示宠物 / 'gold' 只显示金价
const gold = ref(null); // 金价数据（来自主进程）
const loading = ref(false); // 是否正在请求金价

// 仅保留手动拖拽：按下进入 drag 状态，松开回到 idle
const { startDrag } = useDrag({
  onStart: () => setState("drag"),
  onEnd: () => setState("idle"),
});

// 右键宠物：隐藏（可从托盘重新显示）
const onContextMenu = (e) => {
  e.preventDefault();
  window.petAPI.action("hide");
};

// 双击：在宠物 / 金价之间切换（主进程持有真正的模式状态）
const toggleMode = () => window.petAPI.toggleMode();

// 向主进程拉取一次金价并更新到本地
async function refreshGold() {
  loading.value = true;
  try {
    gold.value = await window.petAPI.getGold();
  } finally {
    loading.value = false;
  }
}

// 金价模式下的定时轮询（每 20 秒刷新一次）
let timer = null;
function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
function startPolling() {
  refreshGold();
  stopPolling();
  timer = setInterval(refreshGold, 20000);
}

// 仅在进入金价模式时轮询，切回宠物时停止
watch(mode, (m) => {
  if (m === "gold") startPolling();
  else stopPolling();
});

let offMode = null;
onMounted(async () => {
  // 同步主进程当前模式，并订阅后续变化
  mode.value = await window.petAPI.getMode();
  offMode = window.petAPI.onMode((m) => {
    mode.value = m;
  });
});
onUnmounted(() => {
  stopPolling();
  if (offMode) offMode();
});
</script>

<template>
  <div
    class="pet"
    @mousedown="startDrag"
    @contextmenu="onContextMenu"
    @dblclick="toggleMode"
  >
    <PetSprite v-if="mode === 'pet'" :state="state" />
    <GoldPanel
      v-else
      :data="gold"
      :loading="loading"
      @refresh="refreshGold"
    />
  </div>
</template>

<style scoped>
.pet {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}
.pet:active {
  cursor: grabbing;
}
</style>
