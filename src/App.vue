<script setup>
import PetSprite from "./components/PetSprite.vue";
import { usePetState } from "./composables/usePetState.js";
import { useDrag } from "./composables/useDrag.js";

const { state, setState } = usePetState();

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
</script>

<template>
  <div class="pet" @mousedown="startDrag" @contextmenu="onContextMenu">
    <PetSprite :state="state" />
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
