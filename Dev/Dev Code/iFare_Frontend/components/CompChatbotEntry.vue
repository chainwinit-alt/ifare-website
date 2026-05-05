<template>
  <!--
    UIUX #136 — 聊天機器人浮動入口按鈕
    全站右下角圓形按鈕，hover 顯示 tooltip。
    Click 觸發 open 事件（之後由 #137 Welcome 視窗 mount 時接住此事件）。
  -->
  <div class="chatbot-entry">
    <Transition name="tooltip">
      <span
        v-if="showTooltip && !isOpen"
        class="chatbot-entry-tooltip"
        role="tooltip"
      >
        {{ tooltipText }}
      </span>
    </Transition>
    <button
      type="button"
      class="chatbot-entry-btn"
      :class="{ 'is-open': isOpen }"
      :aria-label="isOpen ? '關閉長穩小幫手' : tooltipText"
      :aria-expanded="isOpen"
      @click="handleClick"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
    >
      <!-- 聊天泡泡 icon (open 時切換成 X) -->
      <svg
        v-if="!isOpen"
        class="chatbot-entry-icon"
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="9" cy="11.5" r="1" fill="currentColor" />
        <circle cx="12" cy="11.5" r="1" fill="currentColor" />
        <circle cx="15" cy="11.5" r="1" fill="currentColor" />
      </svg>
      <svg
        v-else
        class="chatbot-entry-icon"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M18 6 6 18M6 6l12 12"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const tooltipText = '需要幫忙嗎？';
const showTooltip = ref(false);

// v-model:open 雙向綁定，讓父層控制視窗開關狀態
const isOpen = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (e: 'open'): void;
  (e: 'close'): void;
}>();

function handleClick() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    emit('open');
    showTooltip.value = false;
  } else {
    emit('close');
  }
}
</script>

<style lang="scss" scoped>
$c-orange: #EA5504;
$c-orange-dark: #C84804;
$c-white: #FFFFFF;
$c-black: #171818;

.chatbot-entry {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chatbot-entry-tooltip {
  padding: 7px 14px;
  background: $c-black;
  color: $c-white;
  font-size: 13px;
  line-height: 1.4;
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba($c-black, 0.16);
  position: relative;

  // 小箭頭指向按鈕
  &::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-left-color: $c-black;
  }
}

.chatbot-entry-btn {
  width: 56px;
  height: 56px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: $c-orange;
  color: $c-white;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba($c-black, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-2px);
    background: $c-orange-dark;
    box-shadow: 0 12px 32px rgba($c-black, 0.24);
  }

  &:focus-visible {
    outline: 3px solid rgba($c-orange, 0.4);
    outline-offset: 2px;
  }

  &:active {
    transform: translateY(0);
  }

  &.is-open {
    background: $c-black;

    &:hover {
      background: lighten($c-black, 10%);
    }
  }
}

.chatbot-entry-icon {
  pointer-events: none;
}

// Tooltip 進出動畫
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

@media (max-width: 768px) {
  .chatbot-entry {
    right: 16px;
    bottom: 16px;
    gap: 8px;
  }

  // 行動裝置 tooltip 隱藏（避免擋畫面，使用者點才知道）
  .chatbot-entry-tooltip {
    display: none;
  }
}
</style>
