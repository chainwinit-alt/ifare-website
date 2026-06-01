<template>
  <transition name="page-tip-fade">
    <div v-if="visible" class="page-tip" role="note">
      <el-icon class="page-tip-icon"><InfoFilled /></el-icon>
      <span class="page-tip-text">{{ tip }}</span>
      <button
        type="button"
        class="page-tip-close"
        aria-label="不再顯示此提示"
        @click="dismiss"
      >
        <el-icon><Close /></el-icon>
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElIcon } from "element-plus";
import { InfoFilled, Close } from "@element-plus/icons-vue";

const STORAGE_PREFIX = "ifare-backend:tip-dismissed:";

const route = useRoute();
const isDismissed = ref(false);

const tip = computed(() => {
  const raw = route.meta?.tip;
  return typeof raw === "string" ? raw : "";
});

const storageKey = computed(() => `${STORAGE_PREFIX}${String(route.name ?? "")}`);

const visible = computed(() => {
  if (!tip.value) return false;
  if (isDismissed.value) return false;
  try {
    return window.localStorage.getItem(storageKey.value) !== "1";
  } catch {
    return true;
  }
});

watch(
  () => route.fullPath,
  () => {
    isDismissed.value = false;
  },
);

function dismiss() {
  isDismissed.value = true;
  try {
    window.localStorage.setItem(storageKey.value, "1");
  } catch {
    // localStorage 不可用時忽略，提示僅在本次顯示
  }
}
</script>

<style lang="scss" scoped>
.page-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  padding: 10px 14px;
  border: 1px solid rgba(234, 85, 4, 0.18);
  border-radius: 12px;
  background: linear-gradient(135deg, #fff8f3, #ffffff);
  box-shadow: 0 6px 18px -16px rgba(23, 24, 24, 0.5);
  color: #5f3a1f;
  font-size: 13px;
  line-height: 1.6;
}

.page-tip-icon {
  flex-shrink: 0;
  color: #ea5504;
  font-size: 16px;
}

.page-tip-text {
  flex: 1;
  word-break: break-word;
}

.page-tip-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #909399;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover,
  &:focus-visible {
    background-color: rgba(234, 85, 4, 0.08);
    color: #ea5504;
    outline: none;
  }
}

.page-tip-fade-enter-active,
.page-tip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-tip-fade-enter-from,
.page-tip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
