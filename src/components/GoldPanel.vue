<script setup>
/**
 * GoldPanel.vue
 * 金价面板组件：在「只显示金价」模式下展示实时金价。
 * 数据由父组件 App.vue 通过 data 传入（来自主进程 petAPI.getGold），
 * Gold-API 国际现货金分别以人民币/克、美元/盎司显示。
 * 点击面板刷新（30 秒内复用缓存），双击（由父组件处理）切回宠物。
 */
import { computed } from "vue";

const props = defineProps({
  data: { type: Object, default: null }, // { ok, cny, usd }
  loading: { type: Boolean, default: false }, // 是否正在请求
});
const emit = defineEmits(["refresh"]);

const cny = computed(() => props.data?.cny || null); // 人民币现货金
const usd = computed(() => props.data?.usd || null); // 美元现货金
const failed = computed(() => props.data && props.data.ok === false); // 抓取失败
const stale = computed(() => cny.value?.stale || usd.value?.stale); // 正在显示上次成功报价

// 保留两位小数，无效值显示占位符
const fmt = (n) => (isFinite(n) ? n.toFixed(2) : "--");

// 取两种币种中最新的上游抓取时间（北京时间），不使用本地请求时间代替。
const latestTime = computed(() => {
  const items = [cny.value, usd.value].filter((item) => item && item.time);
  if (!items.length) return "";
  // 日期 + 时间一起比较，跨日时也能取到较新的一条
  return items.reduce((a, b) =>
    `${b.date || ""}${b.time}` > `${a.date || ""}${a.time}` ? b : a
  );
});

// 悬停查看每项独立的数据源时间，单路失败时提示重试。
const quoteTitle = (item) => item
  ? `Gold-API 国际现货金 · 源更新 ${item.date} ${item.time}（北京时间）${item.stale ? ' · 更新失败，显示上次报价' : ''}`
  : "获取失败，点击重试";
</script>

<template>
  <div class="gold" @click="emit('refresh')" title="点击刷新 · 双击切回宠物">
    <div class="title">
      实时金价<span class="dot" :class="{ on: loading }"></span>
    </div>

    <div v-if="failed" class="err" :title="data.error">连接失败，点击重试</div>

    <template v-else>
      <div class="row" :title="quoteTitle(cny)">
        <span class="label">人民币金</span>
        <span class="main">
          <span class="price">{{ cny ? "¥" + fmt(cny.price) : "--" }}</span>
          <span class="unit">元/克</span>
        </span>
      </div>

      <div class="row" :title="quoteTitle(usd)">
        <span class="label">国际现货金</span>
        <span class="main">
          <span class="price">{{ usd ? "$" + fmt(usd.price) : "--" }}</span>
          <span class="unit">美元/盎司</span>
        </span>
      </div>

      <div class="time" v-if="latestTime" :title="quoteTitle(latestTime)">
        源更新 {{ latestTime.date }} {{ latestTime.time }}
      </div>
      <div v-if="stale" class="warning">更新失败，显示上次报价</div>
      <div v-else-if="data?.error" class="warning">部分报价暂不可用</div>
    </template>
  </div>
</template>

<style scoped>
.gold {
  width: 208px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(24, 26, 32, 0.82);
  backdrop-filter: blur(6px);
  color: #f5f5f5;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  user-select: none;
}

.title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  opacity: 0.85;
  margin-bottom: 8px;
  white-space: nowrap;
}
/* 刷新指示点：加载时闪烁 */
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #888;
  margin-left: 6px;
  flex: none;
}
.dot.on {
  background: #ffd24a;
  animation: blink 0.8s ease-in-out infinite;
}

/* 一行价格：标签 | 数值+单位 | 涨跌幅，整体禁止换行 */
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  white-space: nowrap;
}
.label {
  flex: none;
  font-size: 12px;
  opacity: 0.7;
}
/* 数值与单位竖向排列，作为中间的弹性列 */
.main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.15;
}
.price {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.unit {
  font-size: 10px;
  opacity: 0.5;
  white-space: nowrap;
}
.time {
  margin-top: 6px;
  font-size: 10px;
  opacity: 0.45;
  text-align: right;
}
.err {
  padding: 10px 0;
  text-align: center;
  font-size: 13px;
  color: #ffb4b4;
}
.warning {
  margin-top: 4px;
  color: #ffcf85;
  font-size: 10px;
  text-align: right;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
