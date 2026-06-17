import { ref, computed } from "vue";

// 宠物状态机：idle（待机）/ walk（走动）/ drag（被拖拽）
export function usePetState() {
  const state = ref("idle");
  const facing = ref(1); // 1 朝右，-1 朝左

  const setState = (next) => {
    if (state.value !== next) state.value = next;
  };

  const setFacing = (dir) => {
    if (dir !== 0) facing.value = dir > 0 ? 1 : -1;
  };

  const isDragging = computed(() => state.value === "drag");
  const isWalking = computed(() => state.value === "walk");

  return { state, facing, setState, setFacing, isDragging, isWalking };
}
