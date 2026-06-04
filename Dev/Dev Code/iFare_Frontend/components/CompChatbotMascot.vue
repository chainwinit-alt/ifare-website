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
            <img class="mascot-arm mascot-arm-left" :style="leftArmStyle" :src="leftHand" alt="" />
            <img class="mascot-arm mascot-arm-right" :style="rightArmStyle" :src="rightHand" alt="" />
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
  '我是芒寶，一顆油芒的種子。',
  '雖然我個子小小的，但我來自一座充滿故事的山林。',
  '我的家，在部落阿公的掌心裡，那是我最溫暖的搖籃。',
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
const headShiftX = ref(0);
const headShiftY = ref(0);
const headTilt = ref(0);
const prefersReducedMotion = ref(false);

const seatedBubbleMessages = [
  '有甚麼問題都可以問我喔!',
  '不管是關於我的事或是基金會的事情，我都可以回答!',
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
  queueGazeUpdate();
};

const patrolStyle = computed(() => ({
  transform: `translateX(${props.isOpen ? 24 : prefersReducedMotion.value ? 0 : patrolDirection.value > 0 ? 48 : 0}px)`,
}));

const mascotStyle = computed(() => ({
  transform: `translate3d(${dragOffsetX.value}px, ${dragOffsetY.value}px, 0)`,
}));

const headStyle = computed(() => ({
  transform: `translate(${headShiftX.value}px, ${headShiftY.value - dragLift.value * 0.18}px) rotate(${headTilt.value + dragSwingX.value * 0.2}deg)`,
}));

const bodyStyle = computed(() => ({
  transform: isDragging.value
    ? `translateY(${-12 - dragLift.value * 0.22}px) rotate(${dragSwingX.value * 0.1}deg)`
    : undefined,
}));

const leftArmStyle = computed(() => ({
  transform: isDragging.value
    ? `rotate(${clamp(118 + limbSwingPhase.value * 14 + dragSwingX.value * 0.08, 88, 152)}deg)`
    : undefined,
}));

const rightArmStyle = computed(() => ({
  transform: isDragging.value
    ? `rotate(${clamp(-118 - limbSwingPhase.value * 14 + dragSwingX.value * 0.08, -152, -88)}deg)`
    : undefined,
}));

const leftLegStyle = computed(() => ({
  transform: isDragging.value
    ? `rotate(${clamp(14 + limbSwingPhase.value * 10 + dragSwingX.value * 0.06, -8, 34)}deg)`
    : undefined,
}));

const rightLegStyle = computed(() => ({
  transform: isDragging.value
    ? `rotate(${clamp(-14 - limbSwingPhase.value * 10 + dragSwingX.value * 0.06, -34, 8)}deg)`
    : undefined,
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
  headShiftX.value = clamp(deltaX / 52, -6, 6);
  headShiftY.value = clamp(deltaY / 72, -4, 4);
  headTilt.value = clamp(deltaX / 20, -10, 10);
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
    if (isDragging.value) {
      limbSwingPhase.value += 0.18;
      limbSwingFrame = window.requestAnimationFrame(tick);
      return;
    }

    limbSwingPhase.value *= 0.88;
    if (Math.abs(limbSwingPhase.value) < 0.01) {
      limbSwingPhase.value = 0;
      limbSwingFrame = 0;
      return;
    }

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

function handlePointerMove(event: MouseEvent) {
  pointerActive.value = true;
  pointerX.value = event.clientX;
  pointerY.value = event.clientY;

  if (isDragging.value) {
    const nextX = dragOriginX.value + (event.clientX - dragStartX.value);
    const nextY = dragOriginY.value + (event.clientY - dragStartY.value);
    const clamped = clampDragOffset(nextX, nextY);

    dragSwingX.value = clamp(event.movementX * 1.15, -16, 16);
    dragSwingY.value = clamp(event.movementY * 0.95, -12, 12);
    dragLift.value = clamp(Math.max(-clamped.y, 0) * 0.08 + Math.abs(event.movementY) * 0.35, 0, 22);
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
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return;
  }

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

function handleDragEnd() {
  if (!isDragging.value) {
    return;
  }

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
  }, 3600);
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
  mediaQuery.addEventListener('change', syncReducedMotion);
  syncReducedMotion();
  startBubbleLoop();

  window.addEventListener('mousemove', handlePointerMove, { passive: true });
  window.addEventListener('mouseout', handlePointerOut);
  window.addEventListener('blur', handlePointerLeave);
  window.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('mouseover', handleDocumentMouseOver);
  document.addEventListener('focusin', handleDocumentFocusIn);
  document.addEventListener('mouseout', clearHoverTip);
  document.addEventListener('focusout', clearHoverTip);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncReducedMotion);
  window.removeEventListener('mousemove', handlePointerMove);
  window.removeEventListener('mouseout', handlePointerOut);
  window.removeEventListener('blur', handlePointerLeave);
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
});
</script>

<style lang="scss" scoped>
.chatbot-mascot {
  position: relative;
  width: 176px;
  height: 144px;
  pointer-events: auto;
  cursor: grab;
  user-select: none;
  touch-action: none;
  filter: drop-shadow(0 16px 26px rgba(18, 22, 28, 0.16));
  transition: transform 0.12s ease-out;
}

.chatbot-mascot.is-dragging {
  cursor: grabbing;
}

.chatbot-mascot.is-dragging::after {
  transform: translate(8px, 18px) scaleX(0.72);
  opacity: 0.18;
}

.chatbot-mascot::after {
  content: '';
  position: absolute;
  left: 26px;
  bottom: 8px;
  width: 78px;
  height: 14px;
  border-radius: 999px;
  background: radial-gradient(circle at center, rgba(18, 22, 28, 0.2), rgba(18, 22, 28, 0));
  opacity: 0.45;
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.chatbot-mascot.is-open::after {
  transform: translate(10px, 8px) scaleX(1.14);
  opacity: 0.32;
}

.mascot-track {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.mascot-bubble {
  position: absolute;
  left: 58px;
  top: -70px;
  width: 146px;
  min-height: 54px;
  padding: 11px 14px;
  border: 2px solid rgba(40, 86, 70, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 14px 28px rgba(25, 46, 41, 0.14);
  z-index: 8;
  animation: mascot-bubble-float 3.4s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-bubble {
  left: -122px;
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
  left: 18px;
  bottom: -10px;
  border-style: solid;
}

.mascot-bubble::before {
  border-width: 12px 10px 0 0;
  border-color: rgba(40, 86, 70, 0.12) transparent transparent transparent;
}

.mascot-bubble::after {
  left: 19px;
  bottom: -7px;
  border-width: 10px 8px 0 0;
  border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
}

.mascot-bubble-text {
  margin: 0;
  color: #285646;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 700;
  letter-spacing: 0.01em;
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
  transform: translateY(4px);
  animation: mascot-character-seated-drift 5.4s ease-in-out infinite;
}

.mascot-character-body {
  position: relative;
  width: 112px;
  height: 138px;
  transform-origin: 50% 100%;
  animation: mascot-bob 2.4s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-character-body {
  animation: mascot-seated-bob 3.1s ease-in-out infinite;
}

.chatbot-mascot:not(.is-open) .mascot-character-body {
  animation: mascot-bob 2.4s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-patrol {
  transform: translateX(24px) !important;
}

.chatbot-mascot.is-dragging .mascot-patrol,
.chatbot-mascot.is-dragging .mascot-character,
.chatbot-mascot.is-dragging .mascot-character-body,
.chatbot-mascot.is-dragging .mascot-head-motion,
.chatbot-mascot.is-dragging .mascot-head-wrap,
.chatbot-mascot.is-dragging .mascot-arm,
.chatbot-mascot.is-dragging .mascot-leg,
.chatbot-mascot.is-dragging .mascot-bubble,
.chatbot-mascot.is-dragging .eye-open,
.chatbot-mascot.is-dragging .eye-close,
.chatbot-mascot.is-dragging .mouth-rest,
.chatbot-mascot.is-dragging .mouth-open {
  animation: none !important;
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
  top: 2px;
  left: 16px;
  animation: mascot-head-listen 4.8s ease-in-out infinite;
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
  display: block;
}

.mascot-body {
  left: 24px;
  top: 63px;
  width: 64px;
  z-index: 4;
}

.chatbot-mascot.is-open .mascot-body {
  opacity: 0;
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
  top: 66px;
  width: 33px;
  z-index: 3;
}

.mascot-arm-left {
  left: 12px;
  transform-origin: 76% 16%;
  animation: mascot-arm-left 0.95s ease-in-out infinite;
}

.mascot-arm-right {
  right: 12px;
  transform-origin: 24% 16%;
  animation: mascot-arm-right 0.95s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-arm-left {
  top: 74px;
  left: 20px;
  animation: mascot-seat-arm-left 2.1s ease-in-out infinite;
}

.chatbot-mascot.is-open .mascot-arm-right {
  top: 72px;
  right: 18px;
  animation: mascot-seat-arm-right 2.1s ease-in-out infinite;
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
  opacity: 0;
}

.chatbot-mascot.is-open .mascot-leg-left {
  transform: none;
}

.chatbot-mascot.is-open .mascot-leg-right {
  transform: none;
}

@keyframes mascot-bob {
  0%, 100% {
    transform: translateY(0) scaleY(1);
  }

  35% {
    transform: translateY(-1px) scaleY(1.012);
  }

  70% {
    transform: translateY(0) scaleY(0.992);
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
    transform: rotate(-1.4deg) translateY(0);
  }

  28% {
    transform: rotate(0.8deg) translateY(1px);
  }

  62% {
    transform: rotate(-2.2deg) translateY(0);
  }

  78% {
    transform: rotate(1.6deg) translateY(-1px);
  }
}

@keyframes mascot-head-listen {
  0%, 100% {
    transform: rotate(-2.6deg) translateY(0);
  }

  30% {
    transform: rotate(-0.4deg) translateY(1px);
  }

  58% {
    transform: rotate(2.4deg) translateY(0);
  }

  82% {
    transform: rotate(-1.2deg) translateY(-1px);
  }
}

@keyframes mascot-arm-left {
  0%, 100% {
    transform: rotate(24deg);
  }

  50% {
    transform: rotate(-16deg);
  }
}

@keyframes mascot-arm-right {
  0%, 100% {
    transform: rotate(-24deg);
  }

  50% {
    transform: rotate(16deg);
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
    width: 124px;
    height: 112px;
  }

  .chatbot-mascot::after {
    left: 18px;
    bottom: 6px;
    width: 58px;
    height: 10px;
  }

  .mascot-patrol {
    width: 86px;
    height: 106px;
  }

  .mascot-bubble {
    left: 36px;
    top: -48px;
    width: 112px;
    min-height: 44px;
    padding: 8px 10px;
    border-radius: 14px;
  }

  .chatbot-mascot.is-open .mascot-bubble {
    left: -94px;
    top: -56px;
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
    left: 18px;
    bottom: -8px;
    border-width: 10px 8px 0 0;
  }

  .mascot-bubble::after {
    left: 19px;
    bottom: -6px;
    border-width: 8px 6px 0 0;
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
    top: 0;
    left: 12px;
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
    top: 50px;
    width: 26px;
  }

  .chatbot-mascot.is-open .mascot-arm-left {
    top: 55px;
    left: 14px;
  }

  .chatbot-mascot.is-open .mascot-arm-right {
    top: 54px;
    right: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascot-patrol {
    transition: none;
    transform: translateX(0) !important;
  }

  .mascot-character,
  .mascot-character-body,
  .mascot-bubble,
  .mascot-head-motion,
  .mascot-head-wrap,
  .mascot-arm,
  .mascot-leg,
  .eye-open,
  .eye-close,
  .mouth-rest,
  .mouth-open {
    animation: none !important;
  }
}
</style>
