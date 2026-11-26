/**
 * Gold-API 国际现货金行情：获取美元/盎司与人民币/克报价，转换北京时间并缓存请求。
 */
const https = require("node:https");

const CACHE_MS = 30000;
const GRAMS_PER_TROY_OUNCE = 31.1035;
let cache = null;
let cachedAt = 0;
let pending = null;

// 获取 JSON 报价，拒绝非成功响应，并在超时或连接中断时结束请求。
function requestQuote(currency) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://api.gold-api.com/price/XAU/${currency}`, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Gold-API HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("error", reject);
      res.on("aborted", () => reject(new Error("Gold-API 响应中断")));
      res.on("end", () => {
        try {
          resolve(parseGoldQuote(JSON.parse(Buffer.concat(chunks).toString("utf8")), currency));
        } catch (error) {
          reject(error);
        }
      });
    });
    const timeout = setTimeout(() => req.destroy(new Error("Gold-API 请求超时")), 15000);
    req.on("close", () => clearTimeout(timeout));
    req.on("error", reject);
  });
}

// 校验现货金报价，将人民币盎司价换算为克价；时间始终来自上游并转成北京时间。
function parseGoldQuote(data, currency) {
  if (data.symbol !== "XAU" || data.currency !== currency ||
      typeof data.price !== "number" || !Number.isFinite(data.price) || data.price <= 0 ||
      typeof data.updatedAt !== "string" || !data.updatedAt.endsWith("Z")) {
    throw new Error("Gold-API 报价无效");
  }
  const timestamp = Date.parse(data.updatedAt);
  if (!Number.isFinite(timestamp)) throw new Error("Gold-API 更新时间无效");
  const beijing = new Date(timestamp + 8 * 60 * 60 * 1000).toISOString();
  return {
    price: data.price / (currency === "CNY" ? GRAMS_PER_TROY_OUNCE : 1),
    currency,
    unit: currency === "CNY" ? "gram" : "troy_ounce",
    updatedAt: data.updatedAt,
    date: beijing.slice(0, 10),
    time: beijing.slice(11, 19),
  };
}

// 两种币种独立获取；失败时保留上次成功报价并标记过期，并发调用合并并缓存 30 秒。
async function fetchGold() {
  if (cache && Date.now() - cachedAt < CACHE_MS) return cache;
  if (pending) return pending;
  pending = (async () => {
    const results = await Promise.allSettled([requestQuote("CNY"), requestQuote("USD")]);
    const [cny, usd] = results.map((result, index) => {
      if (result.status === "fulfilled") return { ...result.value, stale: false };
      const previous = cache?.[index === 0 ? "cny" : "usd"];
      return previous ? { ...previous, stale: true } : null;
    });
    cache = {
      ok: Boolean(cny || usd),
      cny,
      usd,
      error: results.filter((result) => result.status === "rejected")
        .map((result) => String(result.reason.message || result.reason)).join("; "),
    };
    cachedAt = Date.now();
    return cache;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

module.exports = { fetchGold, parseGoldQuote };
