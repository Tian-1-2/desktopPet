/**
 * 验证金价单位与跨日时区转换，以及部分失败、并发合并和 30 秒缓存行为。
 * 运行：node --test electron/gold.test.cjs
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const https = require("node:https");
const { parseGoldQuote } = require("./gold.cjs");

// 构造符合官方返回格式的报价，避免测试依赖实时行情数值。
function quote(currency, price = 3110.35) {
  return { symbol: "XAU", currency, price, updatedAt: "2026-11-13T18:30:00Z" };
}

test("人民币盎司价换算为克价，UTC 跨日转北京时间，美元保留盎司价", () => {
  const cny = parseGoldQuote(quote("CNY"), "CNY");
  assert.ok(Math.abs(cny.price - 100) < 1e-8);
  assert.equal(cny.date, "2026-11-14");
  assert.equal(cny.time, "02:30:00");
  assert.equal(cny.updatedAt, "2026-11-13T18:30:00Z");
  assert.equal(parseGoldQuote(quote("USD"), "USD").price, 3110.35);
});

test("拒绝错误品种、币种、非正价格和无效时间", () => {
  for (const change of [
    { symbol: "XAG" }, { currency: "USD" }, { price: 0 },
    { price: "3110.35" }, { price: Infinity },
    { updatedAt: "invalidZ" }, { updatedAt: "2026-11-13T18:30:00" },
  ]) {
    assert.throws(() => parseGoldQuote({ ...quote("CNY"), ...change }, "CNY"));
  }
});

test("首次失败、单路隔离、并发与缓存、断网保留旧报价、恢复清除过期标记", async (t) => {
  let now = 100000;
  let requests = 0;
  let failUSD = true;
  let invalidCNY = true;
  t.mock.method(Date, "now", () => now);
  t.mock.method(https, "get", (url, callback) => {
    requests++;
    const req = new EventEmitter();
    req.destroy = (error) => { req.emit("error", error); req.emit("close"); };
    process.nextTick(() => {
      const currency = url.endsWith("/USD") ? "USD" : "CNY";
      const res = new EventEmitter();
      res.statusCode = currency === "USD" && failUSD ? 503 : 200;
      res.resume = () => {};
      callback(res);
      if (res.statusCode === 200) {
        res.emit("data", Buffer.from(invalidCNY && currency === "CNY"
          ? "invalid json" : JSON.stringify(quote(currency))));
        res.emit("end");
      }
      req.emit("close");
    });
    return req;
  });
  // 重新加载模块，使缓存独立于其它测试。
  delete require.cache[require.resolve("./gold.cjs")];
  const { fetchGold } = require("./gold.cjs");
  const initial = await fetchGold();
  assert.equal(initial.ok, false);
  assert.equal(initial.cny, null);
  assert.equal(initial.usd, null);
  now += 30000;
  invalidCNY = false;
  requests = 0;
  const [first, concurrent] = await Promise.all([fetchGold(), fetchGold()]);
  assert.equal(requests, 2);
  assert.equal(first, concurrent);
  assert.equal(first.ok, true);
  assert.ok(first.cny);
  assert.equal(first.usd, null);
  assert.match(first.error, /503/);
  now += 29999;
  assert.equal(await fetchGold(), first);
  assert.equal(requests, 2);
  now++;
  failUSD = false;
  const recovered = await fetchGold();
  assert.ok(recovered.cny && recovered.usd);
  assert.equal(requests, 4);
  now += 30000;
  failUSD = true;
  invalidCNY = true;
  const failed = await fetchGold();
  assert.equal(failed.ok, true);
  assert.equal(failed.cny.price, recovered.cny.price);
  assert.equal(failed.usd.price, recovered.usd.price);
  assert.equal(failed.cny.updatedAt, recovered.cny.updatedAt);
  assert.equal(failed.cny.stale, true);
  assert.equal(failed.usd.stale, true);
  assert.ok(failed.error);
  now += 30000;
  failUSD = false;
  invalidCNY = false;
  const fresh = await fetchGold();
  assert.equal(fresh.cny.stale, false);
  assert.equal(fresh.usd.stale, false);
  assert.equal(fresh.error, "");
});
