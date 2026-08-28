import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders shopper app metadata and shell", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>BondLayer Shopper<\/title>/i);
  assert.match(
    html,
    /A local shopper-facing experience for comparing retailer prices, loyalty benefits, and private member offers\./,
  );
  assert.match(html, /SIMULATED STORES/);
  assert.match(html, /\/products\/phone\.png/);
  assert.match(html, /Ask for A\$90 private discount/);
  assert.match(html, /Add AirPods: save A\$79/);
  assert.doesNotMatch(html, /Online % deal/);
  assert.doesNotMatch(html, /codex-preview/i);
});

test("catalog uses concrete numbered promo labels", async () => {
  const catalog = await readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8");

  assert.match(catalog, /5% app coupon capped at A\$60/);
  assert.match(catalog, /A\$50 new-customer code/);
  assert.match(catalog, /Buy socks: 50% off/);
  assert.doesNotMatch(catalog, /Online % deal/);
  assert.doesNotMatch(catalog, /New-customer promo/);
});
