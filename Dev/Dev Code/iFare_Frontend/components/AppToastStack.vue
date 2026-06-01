<template>
  <!-- 2026-05-25 UIUX #62 — Toast 堆疊容器，固定底部 right (桌機) / bottom (手機) -->
  <Teleport to="body">
    <div class="toast-stack" role="region" aria-label="系統訊息" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="`toast-${t.type}`"
          role="status"
        >
          <span class="toast-icon" :aria-hidden="true">
            <template v-if="t.type === 'success'">✓</template>
            <template v-else-if="t.type === 'error'">!</template>
            <template v-else-if="t.type === 'warning'">!</template>
            <template v-else>i</template>
          </span>

          <div class="toast-body">
            <div class="toast-message">{{ t.message }}</div>
            <div v-if="t.description" class="toast-description">{{ t.description }}</div>
          </div>

          <button
            v-if="t.action"
            type="button"
            class="toast-action"
            @click="onAction(t)"
          >
            {{ t.action.label }}
          </button>

          <button
            type="button"
            class="toast-close"
            :aria-label="`關閉訊息：${t.message}`"
            @click="dismiss(t.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastItem } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

function onAction(t: ToastItem) {
  try {
    t.action?.onClick()
  } finally {
    dismiss(t.id)
  }
}
</script>

<style scoped lang="scss">
.toast-stack {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  right: 16px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #ffffff;
  border-left: 4px solid #909399;
  border-radius: 10px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.25);
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

.toast-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #909399;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.toast-success {
  border-left-color: #67c23a;
  .toast-icon { background: #67c23a; }
}

.toast-error {
  border-left-color: #f56c6c;
  .toast-icon { background: #f56c6c; }
}

.toast-warning {
  border-left-color: #e6a23c;
  .toast-icon { background: #e6a23c; }
}

.toast-info {
  border-left-color: #409eff;
  .toast-icon { background: #409eff; }
}

.toast-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast-message {
  font-weight: 600;
  word-break: break-word;
}

.toast-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.55;
  word-break: break-word;
}

.toast-action {
  flex-shrink: 0;
  align-self: center;
  padding: 4px 10px;
  border: 0;
  background: transparent;
  border-radius: 6px;
  color: #ea5504;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s ease;

  &:hover {
    background: rgba(234, 85, 4, 0.12);
  }
}

.toast-close {
  flex-shrink: 0;
  align-self: flex-start;
  width: 22px;
  height: 22px;
  border: 0;
  background: transparent;
  color: #909399;
  font-size: 18px;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: #f5f7fa;
    color: #303133;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.toast-enter-from {
  transform: translateY(20px) scale(0.98);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.toast-move {
  transition: transform 0.25s ease;
}

@media (max-width: 640px) {
  .toast-stack {
    right: 16px;
    left: 16px;
    width: auto;
  }
}
</style>
