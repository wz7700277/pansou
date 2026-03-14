<template>
  <div class="layout">
    <header class="header">
      <nav class="nav">
        <NuxtLink to="/" class="brand">PanHub</NuxtLink>
        <div class="spacer" />
        <NuxtLink to="/api" class="link">API</NuxtLink>
        <button class="link" type="button" @click="openSettings = true">
          设置
        </button>
      </nav>
    </header>
    <main class="main">
      <NuxtPage />
    </main>
    <ClientOnly>
      <SettingsDrawer
        v-model="settings"
        v-model:open="openSettings"
        :all-plugins="ALL_PLUGIN_NAMES"
        @save="onSaveSettings"
        @reset-default="resetToDefault" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import SettingsDrawer from "./pages/index/SettingsDrawer.vue";

const ALL_PLUGIN_NAMES = [
  "pansearch",
  "pan666",
  "qupansou",
  "panta",
  "hunhepan",
  "jikepan",
  "zhizhen",
  "ouge",
  "wanou",
  "labi",
  "susu",
  "fox4k",
  "hdr4k",
  "thepiratebay",
  "duoduo",
  "muou",
  "xuexizhinan",
  "huban",
  "panyq",
  "shandian",
];

type UserSettings = {
  enableTG: boolean;
  tgChannels: string;
  enabledPlugins: string[];
};

const openSettings = ref(false);
// 默认展示所有插件，但默认不勾选 thepiratebay
const DEFAULT_ENABLED_PLUGINS = ALL_PLUGIN_NAMES.filter(
  (n) => n !== "thepiratebay"
);
const settings = ref<UserSettings>({
  enableTG: false,
  tgChannels: "",
  enabledPlugins: [...DEFAULT_ENABLED_PLUGINS],
});
const LS_KEY = "panhub.settings";

function loadSettings() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const next: UserSettings = {
      enableTG: !!parsed?.enableTG,
      tgChannels: String(parsed?.tgChannels || ""),
      enabledPlugins: Array.isArray(parsed?.enabledPlugins)
        ? parsed.enabledPlugins.filter((x: any) => typeof x === "string")
        : [...DEFAULT_ENABLED_PLUGINS],
    };
    next.enabledPlugins = next.enabledPlugins.filter((x) =>
      ALL_PLUGIN_NAMES.includes(x)
    );
    if (next.enabledPlugins.length === 0)
      next.enabledPlugins = [...DEFAULT_ENABLED_PLUGINS];
    settings.value = next;
  } catch {}
}
function persistSettings() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings.value));
  } catch {}
}
function onSaveSettings() {
  persistSettings();
}
function resetToDefault() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  }
  settings.value = {
    enableTG: false,
    tgChannels: "",
    enabledPlugins: [...DEFAULT_ENABLED_PLUGINS],
  };
}

onMounted(() => loadSettings());
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  /* 顶部不再吸顶，改由结果区域的 Tab 吸顶 */
  background: #fff;
  border-bottom: 1px solid #eee;
}
.nav {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand {
  font-weight: 800;
  color: #111;
  text-decoration: none;
}
.spacer {
  flex: 1;
}
.link {
  border: 1px solid #eee;
  color: #333;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.link:hover {
  background: #f6f7f9;
}
.main {
  flex: 1;
  /* 初始不出现滚动条，给页脚状态预留 16px 内边距 */
  padding-bottom: 16px;
}
</style>
