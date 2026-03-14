<template>
  <section class="search">
    <div class="search__box" :class="{ focused: isFocused }">
      <span class="search__icon">🔎</span>
      <input
        :value="modelValue"
        :placeholder="placeholder"
        @input="
          $emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keyup.enter="$emit('search')" />
      <button
        v-if="modelValue"
        class="btn btn--ghost"
        @click="
          $emit('update:modelValue', '');
          $emit('reset');
        ">
        重置
      </button>
      <button
        class="btn btn--primary"
        :disabled="!modelValue || loading"
        @click="$emit('search')">
        {{ loading ? "搜索中…" : "搜索" }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; loading: boolean; placeholder: string }>();
defineEmits(["update:modelValue", "search", "reset"]);

const isFocused = ref(false);
</script>

<style scoped>
.search {
  margin-top: 16px;
}
.search__box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
}
.search__box.focused {
  box-shadow: 0 10px 30px rgba(38, 132, 255, 0.12);
}
.search__icon {
  opacity: 0.6;
}
.search__box input {
  flex: 1;
  border: 0;
  outline: none;
  font-size: 16px;
}
.btn {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  border-radius: 10px;
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

/* 小屏优化：按钮换行、输入占满 */
@media (max-width: 640px) {
  .search__box {
    flex-wrap: wrap;
    gap: 6px;
  }
  .search__icon {
    display: none;
  }
  .search__box input {
    width: 100%;
    font-size: 15px;
  }
  .btn {
    padding: 8px 10px;
    font-size: 14px;
  }
}
</style>
