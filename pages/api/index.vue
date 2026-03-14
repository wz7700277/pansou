<template>
  <div class="container">
    <header class="hero">
      <div class="hero__title">PanHub API</div>
      <div class="hero__subtitle">快速构造请求，调试 Nuxt4 服务端接口</div>
    </header>

    <div class="grid">
      <!-- 左侧：表单区域 -->
      <section class="panel">
        <h2 class="panel__title">请求参数</h2>
        <div class="form-grid">
          <label>
            <span>kw (必填)</span>
            <input v-model="kw" placeholder="关键词" />
          </label>

          <label>
            <span>channels (逗号分隔)</span>
            <input v-model="channels" placeholder="alipanshare,tgxiazaiyuan" />
            <small class="hint">
              常用示例：
              <button
                class="chip"
                type="button"
                @click="setChannels('alipanshare,tgxiazaiyuan')">
                alipanshare,tgxiazaiyuan
              </button>
              <button
                class="chip"
                type="button"
                @click="setChannels('pansearch_zh')">
                pansearch_zh
              </button>
            </small>
          </label>

          <label>
            <span>plugins (逗号分隔)</span>
            <input v-model="plugins" placeholder="hunhepan" />
            <small class="hint">
              插件示例：
              <button class="chip" type="button" @click="plugins = 'hunhepan'">
                hunhepan
              </button>
            </small>
          </label>

          <label>
            <span>cloud_types (逗号分隔)</span>
            <input v-model="cloudTypes" placeholder="aliyun,baidu" />
          </label>

          <label>
            <span>conc</span>
            <input
              v-model.number="conc"
              type="number"
              min="1"
              placeholder="10" />
          </label>

          <label>
            <span>refresh</span>
            <input v-model="refresh" type="checkbox" />
          </label>

          <label>
            <span>res</span>
            <select v-model="res">
              <option value="merged_by_type">merged_by_type</option>
              <option value="results">results</option>
              <option value="all">all</option>
            </select>
          </label>

          <label>
            <span>src</span>
            <select v-model="src">
              <option value="all">all</option>
              <option value="tg">tg</option>
              <option value="plugin">plugin</option>
            </select>
          </label>

          <label class="ext">
            <span>ext (JSON)</span>
            <textarea v-model="ext" rows="3" placeholder='{"foo":"bar"}' />
          </label>
        </div>

        <div class="actions">
          <button
            class="btn btn--primary"
            :disabled="!kw || loading"
            @click="onSearchGet">
            GET /api/search
          </button>
          <button class="btn" :disabled="!kw || loading" @click="onSearchPost">
            POST /api/search
          </button>
          <span v-if="loading" class="loading">请求中...</span>
        </div>

        <div v-if="error" class="alert">{{ error }}</div>
      </section>

      <!-- 右侧：结果展示 -->
      <section class="panel">
        <div class="panel__header">
          <h2 class="panel__title">响应</h2>
          <div class="panel__tools">
            <span v-if="resultTotal !== null" class="badge"
              >total: {{ resultTotal }}</span
            >
            <button
              class="btn btn--ghost"
              :disabled="!result"
              @click="copyResult">
              复制
            </button>
          </div>
        </div>
        <div class="result">
          <pre v-if="result">{{ pretty(result) }}</pre>
          <div v-else class="placeholder">还没有数据，点击左侧按钮发送请求</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "PanHub API",
  description: "用于快速构造请求、调试 PanHub 的 /api/search 接口。",
});
useHead({ meta: [{ name: "robots", content: "noindex,nofollow" }] });

const config = useRuntimeConfig();
const apiBase = (config.public?.apiBase as string) || "/api";

const kw = ref("");
const channels = ref("");
const plugins = ref("hunhepan");
const cloudTypes = ref("");
const conc = ref<number | undefined>(undefined);
const refresh = ref(false);
const res = ref<"merged_by_type" | "results" | "all">("merged_by_type");
const src = ref<"all" | "tg" | "plugin">("all");
const ext = ref("{}");

const loading = ref(false);
const error = ref("");
const result = ref<any>(null);
const resultTotal = computed<number | null>(() => {
  try {
    if (!result.value) return null;
    if (typeof result.value?.data?.total === "number")
      return result.value.data.total;
    if (typeof result.value?.total === "number") return result.value.total;
    return null;
  } catch {
    return null;
  }
});

function parseList(val: string) {
  const arr = val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

function pretty(data: unknown) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

async function onSearchGet() {
  error.value = "";
  result.value = null;
  loading.value = true;
  try {
    const query: Record<string, any> = { kw: kw.value };
    if (channels.value) query.channels = channels.value;
    if (plugins.value) query.plugins = plugins.value;
    if (cloudTypes.value) query.cloud_types = cloudTypes.value;
    if (typeof conc.value === "number") query.conc = conc.value;
    if (refresh.value) query.refresh = "true";
    if (res.value) query.res = res.value;
    if (src.value) query.src = src.value;
    if (ext.value) query.ext = ext.value;

    const data = await $fetch(`${apiBase}/search`, { method: "GET", query });
    result.value = data;
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || "请求失败";
  } finally {
    loading.value = false;
  }
}

async function onSearchPost() {
  error.value = "";
  result.value = null;
  loading.value = true;
  try {
    let extObj: any = undefined;
    if (ext.value && ext.value.trim()) {
      try {
        extObj = JSON.parse(ext.value);
      } catch (e: any) {
        throw new Error("ext 不是有效的 JSON: " + e?.message);
      }
    }
    const body: Record<string, any> = {
      kw: kw.value,
      res: res.value,
      src: src.value,
      refresh: refresh.value,
      ext: extObj ?? {},
    };
    const ch = parseList(channels.value);
    const pl = parseList(plugins.value);
    const ct = parseList(cloudTypes.value);
    if (ch) body.channels = ch;
    if (pl) body.plugins = pl;
    if (ct) body.cloud_types = ct;
    if (typeof conc.value === "number") body.conc = conc.value;

    const data = await $fetch(`${apiBase}/search`, { method: "POST", body });
    result.value = data;
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || "请求失败";
  } finally {
    loading.value = false;
  }
}

function setChannels(v: string) {
  channels.value = v;
}

async function copyResult() {
  if (!result.value) return;
  try {
    await navigator.clipboard.writeText(pretty(result.value) as string);
  } catch {}
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 32px auto;
  padding: 0 20px;
}

.hero {
  padding: 18px 20px;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  background: linear-gradient(180deg, #fafafa, #f6faff);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02) inset;
}
.hero__title {
  font-size: 22px;
  font-weight: 700;
}
.hero__subtitle {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}
.panel {
  grid-column: span 12;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
@media (min-width: 960px) {
  .panel:first-of-type {
    grid-column: span 5;
  }
  .panel:last-of-type {
    grid-column: span 7;
  }
}
.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.panel__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}
.panel__tools {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
label span {
  font-size: 12px;
  color: #666;
}
label small.hint {
  color: #888;
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f9fafb;
  cursor: pointer;
}
.chip:hover {
  background: #f3f4f6;
}
input,
select,
textarea {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #2684ff;
  box-shadow: 0 0 0 3px rgba(38, 132, 255, 0.12);
}
label.ext {
  grid-column: 1 / span 2;
}
.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 14px 0;
}
.btn {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  border-radius: 8px;
  cursor: pointer;
}
.btn:hover {
  background: #f6f7f9;
}
.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn--primary {
  background: #111;
  color: #fff;
  border-color: #111;
}
.btn--primary:hover {
  background: #000;
}
.btn--ghost {
  background: transparent;
}
.loading {
  color: #666;
  font-size: 13px;
}
.badge {
  display: inline-block;
  background: #0a7;
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.error {
  color: #b00020;
  margin: 8px 0;
}
.result pre {
  background: #0a0a0a;
  color: #d6ffd6;
  padding: 12px;
  border-radius: 6px;
  overflow: auto;
}
.placeholder {
  color: #888;
  font-size: 13px;
}
.alert {
  background: #fff6f6;
  border: 1px solid #ffd1d1;
  color: #a40000;
  padding: 8px 10px;
  border-radius: 8px;
}
</style>
