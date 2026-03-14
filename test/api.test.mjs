// Simple API smoke tests for Nitro endpoints
// Usage:
//   API_BASE=http://localhost:3000/api pnpm run test:api
// or
//   pnpm run dev  (in another shell) then: pnpm run test:api

import { ofetch } from "ofetch";

const API_BASE = process.env.API_BASE || "http://localhost:3000/api";

function log(...args) {
  console.log("[TEST]", ...args);
}
function err(...args) {
  console.error("[FAIL]", ...args);
}

let failures = 0;
function expect(cond, msg) {
  if (!cond) {
    failures++;
    err(msg);
  }
}

async function safeFetch(url, opts) {
  try {
    return await ofetch(url, { retry: 0, timeout: 20000, ...opts });
  } catch (e) {
    failures++;
    err("Request error:", url, e?.message || e);
    return null;
  }
}

async function testHealth() {
  log("GET /health");
  const data = await safeFetch(`${API_BASE}/health`);
  expect(!!data, "health: response should not be null");
  if (!data) return;
  expect(data.ok === true, "health: ok should be true");
  expect(
    typeof data.pluginCount === "number",
    "health: pluginCount should be number"
  );
  expect(Array.isArray(data.plugins), "health: plugins should be array");
}

async function testSearchGetPlugin() {
  log("GET /search (plugin)");
  const q = new URLSearchParams({
    kw: "test",
    src: "plugin",
    res: "results",
    plugins: "hunhepan",
  });
  const data = await safeFetch(`${API_BASE}/search?${q.toString()}`);
  expect(!!data, "search GET plugin: response should not be null");
  if (!data) return;
  expect(data.ok === true, "search GET plugin: ok should be true");
  expect(
    data.data && typeof data.data.total === "number",
    "search GET plugin: data.total should exist"
  );
}

async function testSearchGetAll() {
  log("GET /search (all)");
  const q = new URLSearchParams({
    kw: "test",
    src: "all",
    res: "results",
    refresh: "true",
  });
  const data = await safeFetch(`${API_BASE}/search?${q.toString()}`);
  expect(!!data, "search GET all: response should not be null");
  if (!data) return;
  expect(data.ok === true, "search GET all: ok should be true");
  expect(
    data.data && typeof data.data.total === "number",
    "search GET all: data.total should exist"
  );
}

async function testSearchPostTG() {
  log("POST /search (tg)");
  const body = {
    kw: "test",
    src: "tg",
    res: "results",
    channels: "tgsearchers3",
    refresh: true,
  };
  const data = await safeFetch(`${API_BASE}/search`, { method: "POST", body });
  expect(!!data, "search POST tg: response should not be null");
  if (!data) return;
  expect(data.ok === true, "search POST tg: ok should be true");
  expect(
    data.data && typeof data.data.total === "number",
    "search POST tg: data.total should exist"
  );
}

async function main() {
  log("API_BASE =", API_BASE);
  await testHealth();
  await testSearchGetPlugin();
  await testSearchGetAll();
  await testSearchPostTG();
  if (failures > 0) {
    err(`Completed with ${failures} failure(s)`);
    process.exit(1);
  } else {
    log("All tests passed");
  }
}

main();
