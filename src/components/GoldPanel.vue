<script setup>
/**
 * GoldPanel.vue
 * 金价面板组件：在「只显示金价」模式下展示实时金价。
 * 数据由父组件 App.vue 通过 data 传入（来自主进程 petAPI.getGold），
 * 包含上海黄金(¥/克, gds_AUTD)与纽约 COMEX 黄金($/盎司, hf_GC)。
 * 涨绿跌红；点击面板手动刷新，双击（由父组件处理）切回宠物。
 */
import { computed } from "vue";

const props = defineProps({
  data: { type: Object, default: null }, // { ok, shanghai, comex, updatedAt }
  loading: { type: Boolean, default: false }, // 是否正在请求
});
const emit = defineEmits(["refresh"]);

const sh = computed(() => props.data?.shanghai || null); // 上海金
const cx = computed(() => props.data?.comex || null); // 国际金
const failed = computed(() => props.data && props.data.ok === false); // 抓取失败

// 根据涨跌方向返回 'up' | 'down' | 'flat'，用于着色
const trend = (item) => {
  if (!item || !isFinite(item.change)) return "flat";
  if (item.change > 0) return "up";
  if (item.change < 0) return "down";
  return "flat";
};

// 带正负号的涨跌百分比文本，如 "+0.42%" / "-1.30%"
const pct = (item) => {
  if (!item || !isFinite(item.changePct)) return "";
  const sign = item.changePct > 0 ? "+" : "";
  return `${sign}${item.changePct.toFixed(2)}%`;
};

// 保留两位小数，无效值显示占位符
const fmt = (n) => (isFinite(n) ? n.toFixed(2) : "--");
</script>

<template>
  <div class="gold" @click="emit('refresh')" title="点击刷新 · 双击切回宠物">
    <div class="title">
      实时金价<span class="dot" :class="{ on: loading }"></span>
    </div>

    <div v-if="failed" class="err">获取失败，点击重试</div>

    <template v-else>
      <div class="row" :class="trend(sh)">
        <span class="label">上海金</span>
        <span class="price">{{ sh ? "¥" + fmt(sh.price) : "--" }}</span>
        <span class="unit">元/克</span>
        <span class="chg">{{ pct(sh) }}</span>
      </div>

      <div class="row" :class="trend(cx)">
        <span class="label">国际金</span>
        <span class="price">{{ cx ? "$" + fmt(cx.price) : "--" }}</span>
        <span class="unit">美元/盎司</span>
        <span class="chg">{{ pct(cx) }}</span>
      </div>

      <div class="time" v-if="sh?.time || cx?.time">
        更新于 {{ sh?.time || cx?.time }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.gold {
  width: 200px;
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
}
/* 刷新指示点：加载时闪烁 */
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #888;
  margin-left: 6px;
}
.dot.on {
  background: #ffd24a;
  animation: blink 0.8s ease-in-out infinite;
}

.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: "label price chg" "label unit chg";
  align-items: center;
  column-gap: 6px;
  padding: 5px 0;
}
.label {
  grid-area: label;
  font-size: 12px;
  opacity: 0.7;
  margin-right: 4px;
}
.price {
  grid-area: price;
  font-size: 19px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.unit {
  grid-area: unit;
  font-size: 10px;
  opacity: 0.5;
}
.chg {
  grid-area: chg;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 涨红跌绿（A 股习惯）；flat 用默认白色 */
.up .price,
.up .chg {
  color: #ff5b5b;
}
.down .price,
.down .chg {
  color: #2fd07a;
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
