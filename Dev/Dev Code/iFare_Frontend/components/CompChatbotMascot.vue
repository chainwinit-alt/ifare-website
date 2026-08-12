<template>
  <div
    ref="mascotRef"
    class="chatbot-mascot"
    :class="{ 'is-open': isOpen, 'is-dragging': isDragging }"
    :style="mascotStyle"
    aria-hidden="true"
    @pointerdown="handleDragStart"
  >
    <div class="mascot-track">
      <div class="mascot-patrol" :style="patrolStyle">
        <div class="mascot-bubble">
          <p class="mascot-bubble-text">{{ activeBubbleMessage }}</p>
        </div>
        <div class="mascot-character">
          <div class="mascot-character-body" :style="bodyStyle">
            <img class="mascot-sit" :src="sit" alt="" />
            <img class="mascot-leg mascot-leg-left" :style="leftLegStyle" :src="leftLeg" alt="" />
            <img class="mascot-leg mascot-leg-right" :style="rightLegStyle" :src="rightLeg" alt="" />
            <span class="mascot-arm mascot-arm-left">
              <img class="mascot-arm-image" :style="leftArmStyle" :src="leftHand" alt="" />
            </span>
            <span class="mascot-arm mascot-arm-right">
              <img class="mascot-arm-image" :style="rightArmStyle" :src="rightHand" alt="" />
            </span>
            <img class="mascot-body" :src="body" alt="" />
            <div class="mascot-head-motion">
              <div ref="headRef" class="mascot-head-wrap" :style="headStyle">
                <img class="mascot-head" :src="head" alt="" />
                <div class="mascot-eye-socket mascot-eye-socket-left">
                  <img class="mascot-eye eye-open" :src="eyeOpen" alt="" />
                  <img class="mascot-eye eye-close" :src="eyeClose" alt="" />
                </div>
                <div class="mascot-eye-socket mascot-eye-socket-right">
                  <img class="mascot-eye eye-open" :src="eyeOpen" alt="" />
                  <img class="mascot-eye eye-close" :src="eyeClose" alt="" />
                </div>
                <img class="mascot-mouth mouth-rest" :src="smile" alt="" />
                <img class="mascot-mouth mouth-open" :src="smileOpen" alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import body from '~/IP/body.png';
import eyeClose from '~/IP/eye_close.png';
import eyeOpen from '~/IP/eye_open.png';
import head from '~/IP/Head.png';
import leftHand from '~/IP/left_hand.png';
import leftLeg from '~/IP/left_leg.png';
import rightHand from '~/IP/right_hand.png';
import rightLeg from '~/IP/right_leg.png';
import smile from '~/IP/smile.png';
import smileOpen from '~/IP/smile_o.png';
import sit from '~/IP/sit.png';

const props = defineProps<{
  isOpen?: boolean;
}>();

const bubbleMessages = [
  '我是芒寶，陪你認識長穩基金會。',
  '長穩基金會聚焦環境保育、人才培育與社會關懷。',
] as const;


const mascotRef = ref<HTMLElement | null>(null);
const headRef = ref<HTMLElement | null>(null);

const activeBubbleIndex = ref(0);
const patrolDirection = ref(1);
const pointerActive = ref(false);
const pointerX = ref(0);
const pointerY = ref(0);
const isDragging = ref(false);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragOriginX = ref(0);
const dragOriginY = ref(0);
const dragSwingX = ref(0);
const dragSwingY = ref(0);
const dragLift = ref(0);
const limbSwingPhase = ref(0);
const hoverTip = ref('');
const gazeX = ref(0);
const gazeY = ref(0);
const headShiftY = ref(0);
const prefersReducedMotion = ref(false);
const isCompactViewport = ref(false);

const seatedBubbleMessages = [
  '智能客服已開啟。',
  '輸入問題，我來協助整理。',
] as const;

const currentBubbleMessages = computed(() =>
  props.isOpen ? seatedBubbleMessages : bubbleMessages,
);

const activeBubbleMessage = computed(() =>
  hoverTip.value || currentBubbleMessages.value[activeBubbleIndex.value],
);

let patrolTimer: ReturnType<typeof setInterval> | null = null;
let bubbleTimer: ReturnType<typeof setInterval> | null = null;
let animationFrame = 0;
let returnFrame = 0;
let limbSwingFrame = 0;
let mediaQuery: MediaQueryList | null = null;
let compactQuery: MediaQueryList | null = null;
let activePointerId: number | null = null;

const syncReducedMotion = () => {
  if (!mediaQuery) {
    return;
  }

  prefersReducedMotion.value = mediaQuery.matches;
  if (prefersReducedMotion.value) {
    stopPatrol();
    patrolDirection.value = 1;
  } else {
    startPatrol();
  }
  // Keep the character alive in both idle and drag states. Reduced-motion only
  // disables the larger patrol movement, not the mascot's local limb motion.
  startLimbSwing();
  queueGazeUpdate();
};

const syncCompactViewport = () => {
  isCompactViewport.value = !!compactQuery?.matches;
  queueGazeUpdate();
};

const patrolStyle = computed(() => ({
  transform: `translateX(${props.isOpen ? 0 : prefersReducedMotion.value ? 0 : patrolDirection.value > 0 ? (isCompactViewport.value ? 34 : 48) : 0}px)`,
}));

const mascotStyle = computed(() => ({
  transform: `translate3d(${dragOffsetX.value}px, ${dragOffsetY.value}px, 0)`,
}));

const headStyle = computed(() => ({
  transform: `translate3d(0, ${headShiftY.value - dragLift.value * 0.18}px, 0)`,
}));

const bodyStyle = computed(() => ({
  transform: `translateY(${
    -12 -
    Math.sin(limbSwingPhase.value) * (isDragging.value ? 2.8 : 1.8) -
    (isDragging.value ? dragLift.value * 0.22 : 0)
  }px) rotate(${
    isDragging.value
      ? dragSwingX.value * 0.12 + Math.sin(limbSwingPhase.value) * 1.5
      : Math.sin(limbSwingPhase.value) * 1.15
  }deg)`,
}));

const leftArmStyle = computed(() => ({
  transform: `rotate(${clamp(
    58 + Math.sin(limbSwingPhase.value) * (isDragging.value ? 12 : 9) + dragSwingX.value * 0.08,
    44,
    74,
  )}deg)`,
}));

const rightArmStyle = computed(() => ({
  transform: `rotate(${clamp(
    -58 - Math.sin(limbSwingPhase.value) * (isDragging.value ? 12 : 9) + dragSwingX.value * 0.08,
    -74,
    -44,
  )}deg)`,
}));

const leftLegStyle = computed(() => ({
  transform: `rotate(${clamp(
    14 + Math.sin(limbSwingPhase.value) * (isDragging.value ? 15 : 11) + dragSwingX.value * 0.08,
    -10,
    38,
  )}deg)`,
}));

const rightLegStyle = computed(() => ({
  transform: `rotate(${clamp(
    -14 - Math.sin(limbSwingPhase.value) * (isDragging.value ? 15 : 11) + dragSwingX.value * 0.08,
    -38,
    10,
  )}deg)`,
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampDragOffset(nextX: number, nextY: number) {
  if (!mascotRef.value) {
    return { x: nextX, y: nextY };
  }

  const rect = mascotRef.value.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - rect.left + dragOffsetX.value;
  const minX = -rect.left + dragOffsetX.value;
  const maxY = window.innerHeight - rect.height - rect.top + dragOffsetY.value;
  const minY = -rect.top + dragOffsetY.value;

  return {
    x: clamp(nextX, minX, maxX),
    y: clamp(nextY, minY, maxY),
  };
}

function updateGaze() {
  animationFrame = 0;

  if (!headRef.value) {
    return;
  }

  const rect = headRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height * 0.45;
  const fallbackX = centerX + patrolDirection.value * 18;
  const fallbackY = centerY - 10;
  const targetX = pointerActive.value ? pointerX.value : fallbackX;
  const targetY = pointerActive.value ? pointerY.value : fallbackY;
  const deltaX = targetX - centerX;
  const deltaY = targetY - centerY;

  gazeX.value = clamp(deltaX / 24, -5, 5);
  gazeY.value = clamp(deltaY / 32, -4, 4);
  headShiftY.value = clamp(deltaY / 90, -2, 2);
}

function queueGazeUpdate() {
  if (animationFrame) {
    return;
  }

  animationFrame = window.requestAnimationFrame(updateGaze);
}

function startLimbSwing() {
  if (limbSwingFrame) {
    return;
  }

  const tick = () => {
    limbSwingPhase.value += isDragging.value ? 0.085 : 0.045;
    limbSwingFrame = window.requestAnimationFrame(tick);
  };

  limbSwingFrame = window.requestAnimationFrame(tick);
}

function updateHoverTipFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    hoverTip.value = '';
    return;
  }

  if (mascotRef.value?.contains(target)) {
    return;
  }

  const tipSource = target.closest<HTMLElement>('[data-mascot-tip]');
  hoverTip.value = tipSource?.dataset.mascotTip?.trim() || '';
}

function handlePointerMove(event: MouseEvent | PointerEvent) {
  if (event instanceof PointerEvent && activePointerId !== null && event.pointerId !== activePointerId) {
    return;
  }

  const previousX = pointerX.value;
  const previousY = pointerY.value;
  pointerActive.value = true;
  pointerX.value = event.clientX;
  pointerY.value = event.clientY;

  if (isDragging.value) {
    if (event.cancelable) {
      event.preventDefault();
    }

    const nextX = dragOriginX.value + (event.clientX - dragStartX.value);
    const nextY = dragOriginY.value + (event.clientY - dragStartY.value);
    const clamped = clampDragOffset(nextX, nextY);
    const movementX = 'movementX' in event ? event.movementX : event.clientX - previousX;
    const movementY = 'movementY' in event ? event.movementY : event.clientY - previousY;

    dragSwingX.value = clamp(movementX * 1.15, -16, 16);
    dragSwingY.value = clamp(movementY * 0.95, -12, 12);
    dragLift.value = clamp(Math.max(-clamped.y, 0) * 0.08 + Math.abs(movementY) * 0.35, 0, 22);
    dragOffsetX.value = clamped.x;
    dragOffsetY.value = clamped.y;
  }

  queueGazeUpdate();
}

function handlePointerLeave() {
  pointerActive.value = false;
  queueGazeUpdate();
}

function handleDocumentMouseOver(event: MouseEvent) {
  updateHoverTipFromTarget(event.target);
}

function handleDocumentFocusIn(event: FocusEvent) {
  updateHoverTipFromTarget(event.target);
}

function clearHoverTip(event?: MouseEvent | FocusEvent) {
  if (event?.relatedTarget instanceof Element) {
    const nextTipSource = event.relatedTarget.closest<HTMLElement>('[data-mascot-tip]');
    if (nextTipSource) {
      hoverTip.value = nextTipSource.dataset.mascotTip?.trim() || '';
      return;
    }
  }

  hoverTip.value = '';
}

function handleDragStart(event: PointerEvent) {
  if (props.isOpen) {
    return;
  }

  if (event.pointerType === 'mouse' && event.button !== 0) {
    return;
  }

  event.preventDefault();
  activePointerId = event.pointerId;
  isDragging.value = true;
  pointerActive.value = true;
  pointerX.value = event.clientX;
  pointerY.value = event.clientY;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragOriginX.value = dragOffsetX.value;
  dragOriginY.value = dragOffsetY.value;
  if (returnFrame) {
    window.cancelAnimationFrame(returnFrame);
    returnFrame = 0;
  }
  startLimbSwing();
  stopPatrol();
  mascotRef.value?.setPointerCapture?.(event.pointerId);
  window.getSelection()?.removeAllRanges();
  queueGazeUpdate();
}

function animateReturnToHome() {
  if (returnFrame) {
    window.cancelAnimationFrame(returnFrame);
  }

  const step = () => {
    const distance = Math.hypot(dragOffsetX.value, dragOffsetY.value);
    const stepSize = 2.6;

    if (distance <= stepSize) {
      dragOffsetX.value = 0;
      dragOffsetY.value = 0;
    } else {
      dragOffsetX.value -= (dragOffsetX.value / distance) * stepSize;
      dragOffsetY.value -= (dragOffsetY.value / distance) * stepSize;
    }

    dragSwingX.value *= 0.9;
    dragSwingY.value *= 0.9;
    dragLift.value *= 0.94;

    if (dragOffsetX.value === 0 && dragOffsetY.value === 0) {
      dragSwingX.value = 0;
      dragSwingY.value = 0;
      dragLift.value = 0;
      returnFrame = 0;
      if (!prefersReducedMotion.value) {
        startPatrol();
      }
      return;
    }

    returnFrame = window.requestAnimationFrame(step);
  };

  returnFrame = window.requestAnimationFrame(step);
}

function handleDragEnd(event?: PointerEvent | MouseEvent) {
  if (event instanceof PointerEvent && activePointerId !== null && event.pointerId !== activePointerId) {
    return;
  }

  if (!isDragging.value) {
    return;
  }

  if (event instanceof PointerEvent && mascotRef.value?.hasPointerCapture?.(event.pointerId)) {
    mascotRef.value.releasePointerCapture(event.pointerId);
  }

  activePointerId = null;
  isDragging.value = false;
  pointerActive.value = false;
  animateReturnToHome();
}

function handlePointerOut(event: MouseEvent) {
  if (event.relatedTarget) {
    return;
  }

  handlePointerLeave();
}

function startPatrol() {
  if (prefersReducedMotion.value || patrolTimer) {
    return;
  }

  patrolTimer = window.setInterval(() => {
    patrolDirection.value = patrolDirection.value > 0 ? -1 : 1;
    queueGazeUpdate();
  }, 3200);
}

function stopPatrol() {
  if (!patrolTimer) {
    return;
  }

  clearInterval(patrolTimer);
  patrolTimer = null;
}

function startBubbleLoop() {
  if (bubbleTimer) {
    return;
  }

  bubbleTimer = window.setInterval(() => {
    activeBubbleIndex.value =
      (activeBubbleIndex.value + 1) % currentBubbleMessages.value.length;
  }, 7000);
}

function stopBubbleLoop() {
  if (!bubbleTimer) {
    return;
  }

  clearInterval(bubbleTimer);
  bubbleTimer = null;
}

watch(
  () => props.isOpen,
  () => {
    activeBubbleIndex.value = 0;
  },
);

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  compactQuery = window.matchMedia('(max-width: 768px)');
  mediaQuery.addEventListener('change', syncReducedMotion);
  compactQuery.addEventListener('change', syncCompactViewport);
  syncCompactViewport();
  syncReducedMotion();
  startBubbleLoop();

  window.addEventListener('pointermove', handlePointerMove, { passive: false });
  window.addEventListener('mousemove', handlePointerMove, { passive: true });
  window.addEventListener('mouseout', handlePointerOut);
  window.addEventListener('blur', handlePointerLeave);
  window.addEventListener('pointerup', handleDragEnd);
  window.addEventListener('pointercancel', handleDragEnd);
  window.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('mouseover', handleDocumentMouseOver);
  document.addEventListener('focusin', handleDocumentFocusIn);
  document.addEventListener('mouseout', clearHoverTip);
  document.addEventListener('focusout', clearHoverTip);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncReducedMotion);
  compactQuery?.removeEventListener('change', syncCompactViewport);
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('mousemove', handlePointerMove);
  window.removeEventListener('mouseout', handlePointerOut);
  window.removeEventListener('blur', handlePointerLeave);
  window.removeEventListener('pointerup', handleDragEnd);
  window.removeEventListener('pointercancel', handleDragEnd);
  window.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('mouseover', handleDocumentMouseOver);
  document.removeEventListener('focusin', handleDocumentFocusIn);
  document.removeEventListener('mouseout', clearHoverTip);
  document.removeEventListener('focusout', clearHoverTip);
  stopPatrol();
  stopBubbleLoop();
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
  }
  if (returnFrame) {
    window.cancelAnimationFrame(returnFrame);
  }
  if (limbSwingFrame) {
    window.cancelAnimationFrame(limbSwingFrame);
  }
  mediaQuery = null;
  compactQuery = null;
});
</script>

<style lang="scss" scoped>
.chatbot-mascot {
  position: relative;
  width: 136px;
  height: 112px;
  pointer-events: auto;
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: transform 0.12s ease-out;
}

.chatbot-mascot.is-dragging {
  cursor: grabbing;
}

.mascot-track {
  position: absolute;
  inset: 0;
  overflow: visible;
  transform: scale(0.84);
  transform-origin: right bottom;
}

.mascot-bubble {
  position: absolute;
  left: auto;
  right: 48px;
  top: -82px;
  width: min(192px, calc(100vw - 64px));
  max-width: calc(100vw - 64px);
  min-height: 64px;
  padding: 12px 14px;
  border: 2px solid rgba(40, 86, 70, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 14px 28px rgba(25, 46, 41, 0.14);
  box-sizing: border-box;
  overflow-wrap: anywhere;
  z-index: 8;
  animation: mascot-bubble-float 3.4s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-bubble {
  left: auto;
  right: 48px;
  top: -82px;
}

.chatbot-mascot.is-open .mascot-bubble::before,
.chatbot-mascot.is-open .mascot-bubble::after {
  left: auto;
}

.chatbot-mascot.is-open .mascot-bubble::before {
  right: 18px;
  border-width: 12px 0 0 10px;
  border-color: rgba(40, 86, 70, 0.12) transparent transparent transparent;
}

.chatbot-mascot.is-open .mascot-bubble::after {
  right: 19px;
  bottom: -7px;
  border-width: 10px 0 0 8px;
  border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
}

.mascot-bubble::before,
.mascot-bubble::after {
  content: '';
  position: absolute;
  left: auto;
  right: 18px;
  bottom: -10px;
  border-style: solid;
}

.mascot-bubble::before {
  border-width: 12px 0 0 10px;
  border-color: rgba(40, 86, 70, 0.12) transparent transparent transparent;
}

.mascot-bubble::after {
  left: auto;
  right: 19px;
  bottom: -7px;
  border-width: 10px 0 0 8px;
  border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
}

.mascot-bubble-text {
  margin: 0;
  color: #285646;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 700;
  letter-spacing: 0;
}

.mascot-patrol {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 112px;
  height: 138px;
  transition: transform 3s ease-in-out;
}

.mascot-character {
  position: absolute;
  inset: 0;
  transform-origin: 50% 100%;
  transition: transform 0.42s ease;
  animation: mascot-character-drift 6.8s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-character {
  transform: none;
  animation: mascot-character-drift 6.8s ease-in-out infinite;
}

.mascot-character-body {
  position: relative;
  width: 112px;
  height: 138px;
  transform-origin: 50% 100%;
  animation: mascot-bob 2.4s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-character-body {
  animation: mascot-bob 2.4s ease-in-out infinite;
}

.chatbot-mascot:not(.is-open) .mascot-character-body {
  animation: mascot-bob 2.4s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-patrol {
  transform: translateX(0) !important;
}

.chatbot-mascot.is-dragging .mascot-patrol,
.chatbot-mascot.is-dragging .mascot-character,
.chatbot-mascot.is-dragging .mascot-character-body,
.chatbot-mascot.is-dragging .mascot-head-motion,
.chatbot-mascot.is-dragging .mascot-head-wrap,
.chatbot-mascot.is-dragging .mascot-arm,
.chatbot-mascot.is-dragging .mascot-arm-image,
.chatbot-mascot.is-dragging .mascot-leg,
.chatbot-mascot.is-dragging .mascot-bubble,
.chatbot-mascot.is-dragging .eye-open,
.chatbot-mascot.is-dragging .eye-close {
  animation: none !important;
}

.chatbot-mascot.is-dragging .mascot-arm {
  z-index: 3;
}

.mascot-head-motion {
  position: absolute;
  left: 12px;
  top: -6px;
  width: 112px;
  height: 88px;
  z-index: 5;
  transform-origin: 50% 86%;
  animation: mascot-head-nod 4.4s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-head-motion {
  top: -6px;
  left: 12px;
  animation: mascot-head-nod 4.4s ease-in-out infinite;
}

.mascot-sit,
.mascot-body,
.mascot-head,
.mascot-leg,
.mascot-arm,
.mascot-eye,
.mascot-mouth {
  position: absolute;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  transition: transform 0.28s ease, top 0.28s ease, left 0.28s ease, right 0.28s ease, bottom 0.28s ease;
}

.mascot-sit {
  display: none;
  left: 18px;
  top: 60px;
  width: 82px;
  z-index: 2;
}

.chatbot-mascot.is-open .mascot-sit {
  display: none;
}

.mascot-body {
  left: 24px;
  top: 63px;
  width: 64px;
  z-index: 4;
}

.chatbot-mascot.is-open .mascot-body {
  opacity: 1;
}

.mascot-head-wrap {
  position: absolute;
  left: 0;
  top: 0;
  width: 88px;
  height: 88px;
  transform-origin: 50% 86%;
  transition: transform 0.16s ease-out;
}

.mascot-head {
  inset: 0;
  width: 100%;
}

.mascot-eye-socket {
  position: absolute;
  top: 32px;
  width: 14px;
  height: 14px;
  z-index: 6;
  overflow: hidden;
}

.mascot-eye-socket-left {
  left: 24px;
}

.mascot-eye-socket-right {
  right: 24px;
}

.mascot-eye {
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 2;
}

.eye-open {
  opacity: 1;
  animation: mascot-blink-open 7.2s steps(1, end) infinite;
}

.eye-close {
  opacity: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  animation: mascot-blink-close 7.2s steps(1, end) infinite;
  z-index: 3;
}

.mascot-mouth {
  left: 32px;
  top: 49px;
  width: 23px;
  z-index: 6;
}

.mouth-rest {
  opacity: 1;
  animation: mascot-mouth-rest 3.2s ease-in-out infinite;
}

.mouth-open {
  opacity: 0;
  left: 34px;
  top: 47px;
  width: 19px;
  animation: mascot-mouth-open 3.2s ease-in-out infinite;
}

.mascot-arm {
  top: 62px;
  width: 40px;
  z-index: 3;
  will-change: transform;
  backface-visibility: hidden;
}

.mascot-arm-image {
  display: block;
  width: 100%;
  height: auto;
  transform-origin: inherit;
  backface-visibility: hidden;
}

.mascot-arm-left .mascot-arm-image {
  animation: mascot-arm-left 1.55s ease-in-out infinite;
}

.mascot-arm-right .mascot-arm-image {
  animation: mascot-arm-right 1.55s ease-in-out infinite;
}

.mascot-arm-left {
  left: 5px;
  transform-origin: 76% 16%;
  animation: none;
}

.mascot-arm-right {
  right: 12px;
  transform-origin: 24% 16%;
  animation: none;
}

.chatbot-mascot.is-open .mascot-arm-left {
  top: 62px;
  left: 5px;
}

.chatbot-mascot.is-open .mascot-arm-right {
  top: 62px;
  right: 12px;
}

.mascot-leg {
  bottom: 2px;
  width: 23px;
  z-index: 2;
}

.mascot-leg-left {
  left: 29px;
  transform-origin: 50% 10%;
  animation: mascot-leg-left 0.95s ease-in-out infinite;
}

.mascot-leg-right {
  right: 29px;
  transform-origin: 50% 10%;
  animation: mascot-leg-right 0.95s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-leg-left,
.chatbot-mascot.is-open .mascot-leg-right {
  opacity: 1;
}

.chatbot-mascot.is-open .mascot-leg-left {
  animation: mascot-leg-left 0.95s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-leg-right {
  animation: mascot-leg-right 0.95s ease-in-out infinite;
}

@keyframes mascot-bob {
  0%, 100% {
    transform: translateY(-3px) rotate(-0.8deg) scaleY(1);
  }

  35% {
    transform: translateY(-8px) rotate(1deg) scaleY(1.012);
  }

  70% {
    transform: translateY(-4px) rotate(-0.5deg) scaleY(0.992);
  }
}

@keyframes mascot-bubble-float {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-2px);
  }
}

@keyframes mascot-character-drift {
  0%, 100% {
    transform: translateY(0) rotate(-0.6deg);
  }

  32% {
    transform: translateY(-1px) rotate(0.8deg);
  }

  68% {
    transform: translateY(0) rotate(-0.2deg);
  }
}

@keyframes mascot-seated-bob {
  0%, 100% {
    transform: translateY(0) scaleY(1);
  }

  40% {
    transform: translateY(-1px) scaleY(1.01);
  }

  75% {
    transform: translateY(1px) scaleY(0.994);
  }
}

@keyframes mascot-character-seated-drift {
  0%, 100% {
    transform: translateY(4px) rotate(-1.2deg);
  }

  38% {
    transform: translateY(2px) rotate(1deg);
  }

  72% {
    transform: translateY(5px) rotate(-0.4deg);
  }
}

@keyframes mascot-head-nod {
  0%, 100% {
    transform: translateY(0);
  }

  28% {
    transform: translateY(1px);
  }

  62% {
    transform: translateY(0);
  }

  78% {
    transform: translateY(-1px);
  }
}

@keyframes mascot-head-listen {
  0%, 100% {
    transform: translateY(0);
  }

  30% {
    transform: translateY(1px);
  }

  58% {
    transform: translateY(0);
  }

  82% {
    transform: translateY(-1px);
  }
}

@keyframes mascot-arm-left {
  0%, 100% {
    transform: rotate(52deg);
  }

  38% {
    transform: rotate(64deg);
  }

  62% {
    transform: rotate(58deg);
  }

  78% {
    transform: rotate(66deg);
  }
}

@keyframes mascot-arm-right {
  0%, 100% {
    transform: rotate(-52deg);
  }

  38% {
    transform: rotate(-64deg);
  }

  62% {
    transform: rotate(-58deg);
  }

  78% {
    transform: rotate(-66deg);
  }
}

@keyframes mascot-wave-left {
  0%, 100% {
    transform: rotate(8deg);
  }

  50% {
    transform: rotate(-28deg);
  }
}

@keyframes mascot-wave-right {
  0%, 100% {
    transform: rotate(-8deg);
  }

  50% {
    transform: rotate(28deg);
  }
}

@keyframes mascot-seat-arm-left {
  0%, 100% {
    transform: rotate(22deg);
  }

  50% {
    transform: rotate(14deg) translateY(1px);
  }
}

@keyframes mascot-seat-arm-right {
  0%, 100% {
    transform: rotate(-20deg);
  }

  50% {
    transform: rotate(-12deg) translateY(-1px);
  }
}

@keyframes mascot-leg-left {
  0%, 100% {
    transform: rotate(18deg);
  }

  50% {
    transform: rotate(-14deg);
  }
}

@keyframes mascot-leg-right {
  0%, 100% {
    transform: rotate(-18deg);
  }

  50% {
    transform: rotate(14deg);
  }
}

@keyframes mascot-leg-left-mobile {
  0%, 100% {
    transform: rotate(12deg);
  }

  50% {
    transform: rotate(-8deg);
  }
}

@keyframes mascot-leg-right-mobile {
  0%, 100% {
    transform: rotate(-12deg);
  }

  50% {
    transform: rotate(8deg);
  }
}

@keyframes mascot-seat-leg-left {
  0%, 100% {
    transform: rotate(96deg);
  }

  50% {
    transform: rotate(88deg) translateY(1px);
  }
}

@keyframes mascot-seat-leg-right {
  0%, 100% {
    transform: rotate(-96deg);
  }

  50% {
    transform: rotate(-88deg) translateY(1px);
  }
}

@keyframes mascot-blink-open {
  0%, 8%, 30%, 54%, 56%, 82%, 100% {
    opacity: 1;
  }

  9%, 11%, 31%, 32%, 55%, 81%, 84% {
    opacity: 0;
  }
}

@keyframes mascot-blink-close {
  0%, 8%, 30%, 54%, 56%, 82%, 100% {
    opacity: 0;
  }

  9%, 11%, 31%, 32%, 55%, 81%, 84% {
    opacity: 1;
  }
}

@keyframes mascot-mouth-rest {
  0%, 56%, 100% {
    opacity: 1;
  }

  60%, 92% {
    opacity: 0;
  }
}

@keyframes mascot-mouth-open {
  0%, 56%, 100% {
    opacity: 0;
  }

  60%, 92% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .chatbot-mascot {
    width: 98px;
    height: 88px;
  }

  .mascot-track {
    transform: scale(0.8);
  }

  .mascot-patrol {
    width: 86px;
    height: 106px;
  }

  .mascot-bubble {
    left: auto;
    right: 38px;
    top: -54px;
    width: min(124px, calc(100vw - 40px));
    max-width: calc(100vw - 40px);
    min-height: 44px;
    padding: 8px 10px;
    border-radius: 14px;
  }

  .chatbot-mascot.is-open .mascot-bubble {
    left: auto;
    right: 38px;
    top: -54px;
  }

  .chatbot-mascot.is-open .mascot-bubble::before {
    right: 14px;
    border-width: 10px 0 0 8px;
  }

  .chatbot-mascot.is-open .mascot-bubble::after {
    right: 15px;
    border-width: 8px 0 0 6px;
  }

  .mascot-bubble::before {
    left: auto;
    right: 16px;
    bottom: -8px;
    border-width: 10px 0 0 8px;
  }

  .mascot-bubble::after {
    left: auto;
    right: 17px;
    bottom: -6px;
    border-width: 8px 0 0 6px;
  }

  .mascot-bubble-text {
    font-size: 10px;
    line-height: 1.35;
  }

  .mascot-character {
    inset: 0;
  }

  .mascot-character-body {
    width: 86px;
    height: 106px;
  }

  .mascot-body {
    left: 18px;
    top: 48px;
    width: 50px;
  }

  .mascot-sit {
    left: 13px;
    top: 48px;
    width: 64px;
  }

  .mascot-head-wrap {
    width: 66px;
    height: 66px;
  }

  .mascot-head-motion {
    left: 10px;
    top: -4px;
    width: 66px;
    height: 66px;
  }

  .chatbot-mascot.is-open .mascot-head-motion {
    top: -4px;
    left: 10px;
  }

  .mascot-eye-socket {
    top: 24px;
    width: 11px;
    height: 11px;
  }

  .mascot-eye-socket-left {
    left: 18px;
  }

  .mascot-eye-socket-right {
    right: 18px;
  }

  .eye-close {
    width: 100%;
    height: 100%;
  }

  .mascot-mouth {
    left: 24px;
    top: 37px;
    width: 18px;
  }

  .mouth-open {
    left: 25px;
    top: 36px;
    width: 16px;
  }

  .mascot-arm {
    top: 47px;
    width: 31px;
  }

  .mascot-arm-left {
    left: 2px;
  }

  .mascot-arm-right {
    right: 18px;
  }

  .chatbot-mascot.is-open .mascot-arm-left {
    top: 47px;
    left: 2px;
  }

  .chatbot-mascot.is-open .mascot-arm-right {
    top: 47px;
    right: 18px;
  }

  .mascot-leg {
    bottom: 1px;
    width: 18px;
  }

  .mascot-leg-left {
    left: 20px;
    animation: mascot-leg-left-mobile 0.95s ease-in-out infinite;
  }

  .mascot-leg-right {
    right: 20px;
    animation: mascot-leg-right-mobile 0.95s ease-in-out infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascot-patrol {
    transition: none;
    transform: translateX(0) !important;
  }
}
</style>
