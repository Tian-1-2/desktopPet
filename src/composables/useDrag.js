import { onBeforeUnmount } from "vue";

// 拖拽：在渲染进程根据鼠标屏幕坐标算出窗口新左上角，交主进程 setPosition。
// callbacks: { onStart, onEnd }
export function useDrag({ onStart, onEnd } = {}) {
  let dragging = false;
  let originWin = { x: 0, y: 0 }; // 按下时窗口左上角
  let originMouse = { x: 0, y: 0 }; // 按下时鼠标屏幕坐标

  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.screenX - originMouse.x;
    const dy = e.screenY - originMouse.y;
    window.petAPI.move(originWin.x + dx, originWin.y + dy);
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    if (onEnd) onEnd();
  };

  const startDrag = async (e) => {
    if (e.button !== 0) return; // 仅左键
    const bounds = await window.petAPI.getBounds();
    if (!bounds) return;
    dragging = true;
    originWin = { x: bounds.x, y: bounds.y };
    originMouse = { x: e.screenX, y: e.screenY };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    if (onStart) onStart();
  };

  onBeforeUnmount(() => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  });

  return { startDrag };
}
