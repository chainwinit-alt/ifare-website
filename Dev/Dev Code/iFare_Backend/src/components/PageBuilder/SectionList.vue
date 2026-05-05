<template>
  <!--
    UIUX 動態頁 CMS — Section 容器 (v2 範本式)
    管理多個 SectionEditor + 範本選擇器 + HTML5 拖拉排序
  -->
  <div class="section-list">
    <SectionEditor
      v-for="(s, idx) in sections"
      :key="s.id"
      :model-value="s"
      :can-move-up="idx > 0"
      :can-move-down="idx < sections.length - 1"
      :class="{ 'drop-target': dropTargetIdx === idx, 'is-dragging': dragSourceIdx === idx }"
      @move-up="moveUp(idx)"
      @move-down="moveDown(idx)"
      @duplicate="duplicate(idx)"
      @remove="remove(idx)"
      @dragstart="onDragStart($event, idx)"
      @dragover="onDragOver($event, idx)"
      @dragend="onDragEnd"
      @drop="onDrop($event, idx)"
    />

    <div v-if="sections.length === 0" class="empty-state">
      <p>從下方選一個範本開始建構頁面 👇</p>
    </div>

    <!-- 範本選擇器 — 視覺縮圖 mockup -->
    <div class="template-gallery">
      <h5 class="gallery-title">＋ 選擇範本</h5>
      <div class="template-grid">
        <button
          v-for="(meta, type) in SECTION_TYPE_META"
          :key="type"
          type="button"
          class="template-card"
          :title="meta.description"
          @click="addSection(type as SectionType)"
        >
          <div class="template-thumb" :class="`thumb-${type}`">
            <template v-if="type === 'hero'">
              <span class="thumb-bar bar-h1"></span>
              <span class="thumb-bar bar-shadow"></span>
            </template>
            <template v-else-if="type === 'text-section'">
              <span class="thumb-bar bar-h2"></span>
              <span class="thumb-bar bar-line w-100"></span>
              <span class="thumb-bar bar-line w-85"></span>
              <span class="thumb-bar bar-line w-70"></span>
            </template>
            <template v-else-if="type === 'four-card'">
              <div v-for="i in 4" :key="i" class="thumb-mini-card">
                <span class="thumb-dot"></span>
                <span class="thumb-bar bar-line w-100"></span>
              </div>
            </template>
            <template v-else-if="type === 'image-text'">
              <div class="thumb-image">🖼</div>
              <div class="thumb-text-col">
                <span class="thumb-bar bar-h2"></span>
                <span class="thumb-bar bar-line w-100"></span>
                <span class="thumb-bar bar-line w-70"></span>
                <span class="thumb-bar bar-cta"></span>
              </div>
            </template>
            <template v-else-if="type === 'cta-card'">
              <div v-for="i in 2" :key="i" class="thumb-cta-mini">
                <span class="thumb-bar bar-h2"></span>
                <span class="thumb-bar bar-cta"></span>
              </div>
            </template>
          </div>
          <div class="template-info">
            <div class="template-label">{{ meta.label }}</div>
            <div class="template-desc">{{ meta.description }}</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SectionEditor from './SectionEditor.vue';
import {
  type Section,
  type SectionType,
  createDefaultSection,
  duplicateSection,
  SECTION_TYPE_META,
} from '@/composables/useDynamicPages';

// Vue 3.3 不支援 defineModel — 用 props 接 reactive array
const props = defineProps<{ modelValue: Section[] }>();
const sections = computed(() => props.modelValue);

function addSection(type: SectionType) {
  sections.value.push(createDefaultSection(type));
}

function remove(idx: number) {
  sections.value.splice(idx, 1);
}

function duplicate(idx: number) {
  const copy = duplicateSection(sections.value[idx]);
  sections.value.splice(idx + 1, 0, copy);
}

function moveUp(idx: number) {
  if (idx <= 0) return;
  const arr = sections.value;
  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
}

function moveDown(idx: number) {
  if (idx >= sections.value.length - 1) return;
  const arr = sections.value;
  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
}

// ── HTML5 native drag-and-drop ──
const dragSourceIdx = ref<number | null>(null);
const dropTargetIdx = ref<number | null>(null);

function onDragStart(ev: DragEvent, idx: number) {
  dragSourceIdx.value = idx;
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', String(idx));
  }
}

function onDragOver(ev: DragEvent, idx: number) {
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
  dropTargetIdx.value = idx;
}

function onDragEnd() {
  dragSourceIdx.value = null;
  dropTargetIdx.value = null;
}

function onDrop(ev: DragEvent, idx: number) {
  ev.preventDefault();
  const fromIdx = dragSourceIdx.value;
  if (fromIdx === null || fromIdx === idx) {
    onDragEnd();
    return;
  }
  const arr = sections.value;
  const [moved] = arr.splice(fromIdx, 1);
  arr.splice(idx, 0, moved);
  onDragEnd();
}
</script>

<style lang="scss" scoped>
.section-list {
  display: flex;
  flex-direction: column;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #909399;
  background: #F5F7FA;
  border: 1px dashed #DCDFE6;
  border-radius: 8px;
  margin-bottom: 16px;
}

.template-gallery {
  margin-top: 12px;
  padding: 16px;
  background: #FFF7F0;
  border: 1px dashed #EA5504;
  border-radius: 8px;
}

.gallery-title {
  margin: 0 0 12px;
  font-size: 14px;
  color: #EA5504;
  font-weight: 600;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.template-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  border: 1px solid #E4E7ED;
  border-radius: 6px;
  background: #FFFFFF;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: #EA5504;
    background: rgba(234, 85, 4, 0.04);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px -4px rgba(234, 85, 4, 0.18);

    .template-thumb { background: #FFF7F0; }
  }

  .template-info {
    padding: 10px 12px 12px;

    .template-label {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 2px;
    }
    .template-desc {
      font-size: 11px;
      color: #909399;
      line-height: 1.4;
    }
  }
}

// ── 視覺縮圖 mockup ──
.template-thumb {
  width: 100%;
  height: 84px;
  padding: 10px;
  background: #F5F7FA;
  border-bottom: 1px solid #E4E7ED;
  display: flex;
  box-sizing: border-box;
  transition: background 0.2s ease;
}

.thumb-bar {
  display: block;
  border-radius: 2px;
}
.bar-h1 { height: 8px; width: 60%; background: #303133; margin-bottom: 4px; }
.bar-shadow { height: 14px; width: 80%; background: rgba(234, 85, 4, 0.15); }
.bar-h2 { height: 4px; width: 40%; background: #606266; margin-bottom: 4px; }
.bar-line { height: 3px; background: rgba(0, 0, 0, 0.18); margin-bottom: 3px; }
.bar-cta { height: 6px; width: 36%; background: #EA5504; border-radius: 3px; margin-top: 2px; }
.w-100 { width: 100%; }
.w-85  { width: 85%; }
.w-70  { width: 70%; }

.thumb-hero,
.thumb-text-section {
  flex-direction: column;
  justify-content: center;
}
.thumb-four-card {
  gap: 4px;
  align-items: center;
}
.thumb-image-text {
  gap: 8px;
  align-items: center;
}
.thumb-cta-card {
  gap: 6px;
  align-items: center;
}

.thumb-mini-card {
  flex: 1;
  min-width: 0;
  height: 56px;
  padding: 5px 4px;
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;

  .thumb-bar { width: 80%; margin: 0; }
}

.thumb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EA5504;
  flex-shrink: 0;
}

.thumb-image {
  width: 50px;
  height: 50px;
  background: #DCDFE6;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.thumb-text-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.thumb-cta-mini {
  flex: 1;
  min-width: 0;
  height: 60px;
  padding: 8px;
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;

  .bar-h2 { width: 70%; }
}

:deep(.is-dragging) { opacity: 0.4; }
:deep(.drop-target) {
  border-color: #EA5504 !important;
  border-style: dashed !important;
  background: #FFF7F0 !important;
}
</style>
