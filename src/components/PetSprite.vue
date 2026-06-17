<script setup>
/**
 * PetSprite.vue
 * 桌面宠物的视觉角色组件。
 * 优先加载 src/assets/pet/ 下的动画文件（gif/png/webp/jpg），按文件名里的
 * idle / walk / drag 关键词匹配当前状态，找不到则用文件夹里的第一个文件兜底。
 * 若该文件夹没有任何图片，则回退到本组件手绘的「水豚噜噜」SVG/CSS 占位动画。
 * 左右朝向由父组件 App.vue 通过 transform: scaleX(±1) 控制，本组件不处理。
 */
import { computed } from "vue";

const props = defineProps({
  state: { type: String, default: "idle" }, // idle / walk / drag
});

// 构建期扫描宠物动画文件夹；目录为空时返回 {}，不会报错
const modules = import.meta.glob("../assets/pet/*.{gif,png,webp,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
});

// 把 glob 结果整理成 [{ name, url }]，name 为小写文件名，便于按关键词匹配
const files = Object.entries(modules).map(([path, url]) => ({
  name: path.split("/").pop().toLowerCase(),
  url,
}));

// 是否存在用户提供的动画文件（决定走 <img> 还是回退到手绘 SVG）
const hasGif = computed(() => files.length > 0);

// 在文件名里查找包含关键词的文件 url
const pick = (keyword) => files.find((f) => f.name.includes(keyword))?.url;

// 当前状态应显示的动画 url：先按状态名匹配，匹配不到用第一个文件兜底
const gifSrc = computed(() => pick(props.state) || files[0]?.url || "");
</script>

<template>
  <!-- 有动画文件：直接显示 GIF/图片 -->
  <div v-if="hasGif" class="pet-sprite">
    <img :src="gifSrc" class="pet-img" draggable="false" alt="pet" />
  </div>

  <!-- 回退：手绘「水豚噜噜」占位动画 -->
  <div v-else class="pet-sprite" :class="`is-${state}`">
    <svg viewBox="0 0 120 100" width="170" height="142">
      <!-- 地面影子 -->
      <ellipse class="shadow" cx="58" cy="93" rx="40" ry="5" />

      <!-- 整只水豚（统一做呼吸/颠动/摇晃） -->
      <g class="body-group">
        <!-- 后腿（走动时与前腿反相摆动） -->
        <rect class="limb leg-a" x="30" y="74" width="11" height="20" rx="5" />
        <rect class="limb leg-b" x="46" y="76" width="11" height="18" rx="5" />
        <!-- 前腿 -->
        <rect class="limb leg-b" x="70" y="76" width="11" height="18" rx="5" />
        <rect class="limb leg-a" x="86" y="74" width="11" height="20" rx="5" />

        <!-- 身体 -->
        <ellipse class="body" cx="54" cy="56" rx="42" ry="30" />
        <!-- 头部（与身体相连的圆头） -->
        <ellipse class="body" cx="86" cy="52" rx="25" ry="24" />
        <!-- 耳朵 -->
        <ellipse class="body ear" cx="80" cy="31" rx="6" ry="7" />
        <circle class="ear-inner" cx="80" cy="32" r="2.6" />

        <!-- 钝钝的口鼻 -->
        <ellipse class="muzzle" cx="104" cy="60" rx="13" ry="11" />
        <!-- 鼻孔 -->
        <ellipse class="nostril" cx="110" cy="56" rx="1.6" ry="2.4" />
        <ellipse class="nostril" cx="110" cy="63" rx="1.6" ry="2.4" />
        <!-- 嘴 -->
        <path class="mouth" d="M100 67 Q104 70 108 67" />

        <!-- 眼睛 -->
        <g class="eyes">
          <circle class="eye" cx="90" cy="46" r="3.2" />
          <circle class="eye-shine" cx="91.1" cy="44.9" r="1" />
        </g>
        <!-- 腮红 -->
        <ellipse class="blush" cx="80" cy="56" rx="4" ry="2.6" />

        <!-- 头顶招牌小橘子 -->
        <g class="orange">
          <circle class="orange-body" cx="72" cy="26" r="9" />
          <path class="orange-leaf" d="M72 17 q5 -4 8 0 q-4 3 -8 0" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.pet-sprite {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 鼠标事件交给父容器处理拖拽 */
}
svg { overflow: visible; }

/* GIF/图片模式：等比铺满窗口 */
.pet-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
  user-select: none;
}

.body { fill: #b78b5e; stroke: #6b4a2b; stroke-width: 2.4; stroke-linejoin: round; }
.ear-inner { fill: #8a5a3b; }
.muzzle { fill: #c79a6c; stroke: #6b4a2b; stroke-width: 2.2; }
.nostril { fill: #5b3b22; }
.mouth { fill: none; stroke: #5b3b22; stroke-width: 1.8; stroke-linecap: round; }
.limb { fill: #a87b50; stroke: #6b4a2b; stroke-width: 2.2; }
.eye { fill: #3a2b1c; }
.eye-shine { fill: #fff; }
.blush { fill: #f0a68a; opacity: 0.65; }
.shadow { fill: rgba(0, 0, 0, 0.18); }
.orange-body { fill: #ff9f43; stroke: #e67e22; stroke-width: 1.6; }
.orange-leaf { fill: #4caf50; }

/* 待机：轻微呼吸 + 耳朵/橘子摆动 */
.is-idle .body-group { animation: breathe 2.6s ease-in-out infinite; transform-origin: 58px 88px; }
.is-idle .orange { animation: wiggle 2.6s ease-in-out infinite; transform-origin: 72px 30px; }

/* 走动：整体上下颠 + 四肢前后交替 */
.is-walk .body-group { animation: hop 0.5s ease-in-out infinite; transform-origin: 58px 88px; }
.is-walk .leg-a { animation: stride 0.5s ease-in-out infinite; }
.is-walk .leg-b { animation: stride 0.5s ease-in-out infinite reverse; }
.is-walk .orange { animation: wiggle 0.5s ease-in-out infinite; transform-origin: 72px 30px; }

/* 拖拽：被拎起来左右晃 + 眯眼 */
.is-drag .body-group { animation: dangle 0.7s ease-in-out infinite; transform-origin: 72px 18px; }
.is-drag .eyes { transform: scaleY(0.35); transform-origin: center 46px; }

@keyframes breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.035) translateY(-1px); }
}
@keyframes hop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes stride {
  0%, 100% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
}
@keyframes dangle {
  0%, 100% { transform: rotate(-7deg); }
  50% { transform: rotate(7deg); }
}
@keyframes wiggle {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
</style>
