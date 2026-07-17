<template>
  <div
    class="chatbot-entry"
    :class="{ 'is-open': isOpen && !isMascotOnly, 'is-mascot-only': isMascotOnly }"
  >
    <!-- 吉祥物本體保留；手機版目前只透過下方 media query 暫時隱藏。 -->
    <div class="chatbot-entry-mascot">
      <CompChatbotMascot :is-open="isOpen && !isMascotOnly" />
    </div>
    <Transition name="tooltip">
      <span
        v-if="showTooltip && !isOpen && !isMascotOnly"
        class="chatbot-entry-tooltip"
        role="tooltip"
      >
        {{ tooltipText }}
      </span>
    </Transition>
    <button
      v-if="!isMascotOnly"
      type="button"
      class="chatbot-entry-btn"
      :class="{ 'is-open': isOpen }"
      :aria-label="isOpen ? '關閉智慧小幫手' : tooltipText"
      :aria-expanded="isOpen"
      data-island="智慧小幫手"
      data-island-style="button"
      :data-mascot-tip="isOpen ? '點這裡會先收起智慧小幫手。' : '點這裡可以打開智慧小幫手，我會陪你一起找功能。'"
      @click="handleClick"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
    >
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
const props = withDefaults(defineProps<{
  mascotOnly?: boolean;
}>(), {
  mascotOnly: false,
});

const tooltipText = '智慧小幫手';
const showTooltip = ref(false);
const isOpen = defineModel<boolean>('open', { default: false });
const isMascotOnly = computed(() => props.mascotOnly);

const emit = defineEmits<{
  (e: 'open'): void;
  (e: 'close'): void;
}>();

function handleClick() {
  if (isMascotOnly.value) {
    isOpen.value = false;
    showTooltip.value = false;
    return;
  }

  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    emit('open');
    showTooltip.value = false;
    return;
  }

  emit('close');
}

watch(isMascotOnly, (mascotOnly) => {
  if (!mascotOnly) return;
  isOpen.value = false;
  showTooltip.value = false;
}, { immediate: true });
</script>

<style lang="scss" scoped>
.chatbot-entry {
  position: fixed;
  right: 24px;
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 1003;
  display: flex;
  align-items: center;
  gap: 14px;
}

.chatbot-entry-mascot {
  position: relative;
  right: auto;
  bottom: auto;
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.chatbot-entry.is-mascot-only {
  gap: 0;
}

.chatbot-entry.is-open .chatbot-entry-mascot {
  position: absolute;
  right: 248px;
  bottom: -24px;
  transform: none;
}

.chatbot-entry-tooltip {
  position: relative;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(23, 24, 24, 0.92);
  box-shadow: 0 10px 24px rgba(23, 24, 24, 0.2);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-left-color: rgba(23, 24, 24, 0.92);
  }
}

.chatbot-entry-btn {
  width: 60px;
  height: 60px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04)),
    linear-gradient(145deg, #f36e21, #ea5504);
  box-shadow:
    0 18px 38px rgba(234, 85, 4, 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.14) inset;
  color: #ffffff;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 22px 42px rgba(234, 85, 4, 0.34),
      0 0 0 1px rgba(255, 255, 255, 0.18) inset;
  }

  &:focus-visible {
    outline: 3px solid rgba(243, 110, 33, 0.32);
    outline-offset: 3px;
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &.is-open {
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04)),
      linear-gradient(145deg, #212121, #111111);
    box-shadow:
      0 18px 34px rgba(17, 17, 17, 0.28),
      0 0 0 1px rgba(255, 255, 255, 0.14) inset;
  }
}

.chatbot-entry-icon {
  pointer-events: none;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@media (max-width: 768px) {
  .chatbot-entry {
    right: 24px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    gap: 8px;
  }

  /*
    手機版暫時關閉吉祥物，桌機版保留。
    後續若要恢復手機版，移除這段 display: none 即可，不需改 template。
  */
  .chatbot-entry.is-mascot-only,
  .chatbot-entry-mascot {
    display: none;
  }

  .chatbot-entry.is-open .chatbot-entry-mascot {
    position: absolute;
    right: 104px;
    bottom: -10px;
    transform: scale(0.88);
    transform-origin: right bottom;
  }

  .chatbot-entry-tooltip {
    display: none;
  }
}
</style>
