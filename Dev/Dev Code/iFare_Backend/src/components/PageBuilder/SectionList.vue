<template>
  <div class="builder-shell">
    <aside class="builder-sidebar">
      <section class="library-card">
        <div class="panel-head">
          <div>
            <h5 class="panel-title">版型元件庫</h5>
            <p class="panel-subtitle">把需要的區塊拖到畫布，或點一下插入到目前區塊後方。</p>
          </div>
          <span class="panel-badge">No-code</span>
        </div>

        <div class="template-grid">
          <button
            v-for="(meta, type) in SECTION_TYPE_META"
            :key="type"
            type="button"
            class="template-card"
            :title="meta.description"
            draggable="true"
            @click="addTemplate(type as SectionType)"
            @dragstart="onTemplateDragStart($event, type as SectionType)"
            @dragend="onDragEnd"
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
                <div class="thumb-image">圖</div>
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
      </section>

      <!-- 2026-05-25 #92/#91 常用組合：一次插 2-3 個 section，省得逐個拖 -->
      <section class="combo-card">
        <div class="panel-head">
          <div>
            <h5 class="panel-title">常用組合</h5>
            <p class="panel-subtitle">一鍵插入常見的版型組合，比逐塊拖快。</p>
          </div>
          <span class="panel-badge combo-badge">一鍵</span>
        </div>

        <div class="combo-grid">
          <button
            v-for="combo in SECTION_COMBOS"
            :key="combo.key"
            type="button"
            class="combo-card-btn"
            :title="combo.description"
            @click="addCombo(combo.key)"
          >
            <span class="combo-icon">{{ combo.icon }}</span>
            <div class="combo-copy">
              <strong>{{ combo.label }}</strong>
              <span>{{ combo.description }}</span>
            </div>
            <span class="combo-count">+{{ combo.sectionTypes.length }} 區塊</span>
          </button>
        </div>
      </section>

      <section class="guide-card">
        <h6 class="guide-title">操作方式</h6>
        <p>1. 上方版型「拖」到畫布，或選下方「常用組合」一鍵插多塊。</p>
        <p>2. 點選畫布中的區塊，直接修改文字、圖片與按鈕。</p>
        <p>3. 右側同步預覽桌機、平板、手機畫面。</p>
      </section>
    </aside>

    <section class="builder-canvas" :class="{ 'is-dragging-mode': isDragInProgress }">
      <div class="canvas-head">
        <div>
          <h5 class="panel-title">頁面畫布</h5>
          <p class="panel-subtitle">點區塊左上「⠿」把手即可拖動排序，或從左側拖版型進來。</p>
        </div>
        <div class="canvas-stats">
          <span>{{ sections.length }} 個區塊</span>
          <span>{{ completedCount }} 個已填內容</span>
        </div>
      </div>

      <div
        class="drop-zone"
        :class="{ active: dropTargetIdx === 0 }"
        @dragover="onCanvasDragOver($event, 0)"
        @drop="onDropAt($event, 0)"
      >
        <span class="drop-zone-text">{{ dropTargetIdx === 0 ? '↧ 放開插入到這裡' : '拖到這裡插入第一個區塊' }}</span>
      </div>

      <div v-if="sections.length === 0" class="empty-state">
        <strong>先從左側拖一個版型進來</strong>
        <p>建議先放 Hero，再接文字、圖片或 CTA，會比較接近前台成品。</p>
      </div>

      <template v-for="(section, idx) in sections" :key="section.id">
        <SectionEditor
          :model-value="section"
          :selected="activeSectionId === section.id"
          :collapsed="activeSectionId !== section.id"
          :can-move-up="idx > 0"
          :can-move-down="idx < sections.length - 1"
          :class="{ 'is-dragging': dragSourceIdx === idx }"
          @select="selectSection(section.id)"
          @toggleCollapse="toggleSection(section.id)"
          @move-up="moveUp(idx)"
          @move-down="moveDown(idx)"
          @duplicate="duplicate(idx)"
          @remove="remove(idx)"
          @dragstart="onSectionDragStart($event, idx)"
          @dragend="onDragEnd"
        />

        <div
          class="drop-zone compact"
          :class="{ active: dropTargetIdx === idx + 1 }"
          @dragover="onCanvasDragOver($event, idx + 1)"
          @drop="onDropAt($event, idx + 1)"
        >
          <span class="drop-zone-text">{{ dropTargetIdx === idx + 1 ? '↧ 放開插入到這裡' : '拖到這裡插入下一個區塊' }}</span>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import SectionEditor from './SectionEditor.vue';
import {
  SECTION_COMBOS,
  SECTION_TYPE_META,
  buildSectionsFromCombo,
  createDefaultSection,
  duplicateSection,
  isSectionEmpty,
  type Section,
  type SectionType,
} from '@/composables/useDynamicPages';

const TEMPLATE_MIME = 'application/x-pagebuilder-template';

const props = defineProps<{ modelValue: Section[] }>();
const sections = computed(() => props.modelValue);

const activeSectionId = ref<string | null>(null);
const dragSourceIdx = ref<number | null>(null);
const dragTemplateType = ref<SectionType | null>(null);
const dropTargetIdx = ref<number | null>(null);

// 2026-05-25 拖拽中視覺反饋 — 顯示更明顯的 drop zone
const isDragInProgress = computed(
  () => dragSourceIdx.value !== null || dragTemplateType.value !== null,
);

const activeSectionIndex = computed(() =>
  activeSectionId.value ? sections.value.findIndex((section) => section.id === activeSectionId.value) : -1,
);

const completedCount = computed(() =>
  sections.value.filter((section) => !isSectionEmpty(section)).length,
);

watch(
  () => sections.value.map((section) => section.id),
  (ids) => {
    if (ids.length === 0) {
      activeSectionId.value = null;
      return;
    }

    if (!activeSectionId.value || !ids.includes(activeSectionId.value)) {
      activeSectionId.value = ids[0];
    }
  },
  { immediate: true },
);

function addTemplate(type: SectionType) {
  const insertIdx = activeSectionIndex.value >= 0 ? activeSectionIndex.value + 1 : sections.value.length;
  insertSectionAt(type, insertIdx);
}

// 2026-05-25 #92/#91 — 一鍵插入一組常用 section（2-3 個）
function addCombo(comboKey: string) {
  const combos = buildSectionsFromCombo(comboKey);
  if (!combos.length) return;

  const insertIdx = activeSectionIndex.value >= 0 ? activeSectionIndex.value + 1 : sections.value.length;
  sections.value.splice(insertIdx, 0, ...combos);
  activeSectionId.value = combos[0].id;
}

function insertSectionAt(type: SectionType, idx: number) {
  const nextSection = createDefaultSection(type);
  sections.value.splice(idx, 0, nextSection);
  activeSectionId.value = nextSection.id;
}

function selectSection(id: string) {
  activeSectionId.value = id;
}

function toggleSection(id: string) {
  activeSectionId.value = activeSectionId.value === id ? null : id;
}

function remove(idx: number) {
  const current = sections.value[idx];
  sections.value.splice(idx, 1);

  if (activeSectionId.value === current?.id) {
    const replacement = sections.value[idx] || sections.value[idx - 1] || null;
    activeSectionId.value = replacement?.id ?? null;
  }
}

function duplicate(idx: number) {
  const copy = duplicateSection(sections.value[idx]);
  sections.value.splice(idx + 1, 0, copy);
  activeSectionId.value = copy.id;
}

function moveUp(idx: number) {
  if (idx <= 0) return;
  const current = sections.value[idx];
  sections.value.splice(idx, 1);
  sections.value.splice(idx - 1, 0, current);
  activeSectionId.value = current.id;
}

function moveDown(idx: number) {
  if (idx >= sections.value.length - 1) return;
  const current = sections.value[idx];
  sections.value.splice(idx, 1);
  sections.value.splice(idx + 1, 0, current);
  activeSectionId.value = current.id;
}

function onTemplateDragStart(ev: DragEvent, type: SectionType) {
  dragSourceIdx.value = null;
  dragTemplateType.value = type;

  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'copy';
    ev.dataTransfer.setData(TEMPLATE_MIME, type);
  }
}

function onSectionDragStart(ev: DragEvent, idx: number) {
  dragSourceIdx.value = idx;
  dragTemplateType.value = null;

  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', String(idx));
  }
}

function onCanvasDragOver(ev: DragEvent, idx: number) {
  const templateType = getDraggedTemplateType(ev);
  const isSectionMove = dragSourceIdx.value !== null;

  if (!templateType && !isSectionMove) return;

  ev.preventDefault();
  dropTargetIdx.value = idx;

  if (ev.dataTransfer) {
    ev.dataTransfer.dropEffect = templateType ? 'copy' : 'move';
  }
}

function onDropAt(ev: DragEvent, idx: number) {
  ev.preventDefault();

  const templateType = getDraggedTemplateType(ev);
  if (templateType) {
    insertSectionAt(templateType, idx);
    resetDragState();
    return;
  }

  if (dragSourceIdx.value === null) {
    resetDragState();
    return;
  }

  const fromIdx = dragSourceIdx.value;
  if (fromIdx === idx || fromIdx + 1 === idx) {
    resetDragState();
    return;
  }

  const moved = sections.value[fromIdx];
  sections.value.splice(fromIdx, 1);

  const targetIdx = fromIdx < idx ? idx - 1 : idx;
  sections.value.splice(targetIdx, 0, moved);
  activeSectionId.value = moved.id;
  resetDragState();
}

function onDragEnd() {
  resetDragState();
}

function resetDragState() {
  dragSourceIdx.value = null;
  dragTemplateType.value = null;
  dropTargetIdx.value = null;
}

function getDraggedTemplateType(ev: DragEvent): SectionType | null {
  if (dragTemplateType.value) return dragTemplateType.value;

  const value = ev.dataTransfer?.getData(TEMPLATE_MIME);
  if (!value) return null;
  return value as SectionType;
}
</script>

<style lang="scss" scoped>
.builder-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
}

.builder-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.library-card,
.guide-card,
.builder-canvas {
  border: 1px solid #ebeef5;
  border-radius: 16px;
  background: #ffffff;
}

.library-card,
.guide-card,
.combo-card {
  padding: 16px;
}

.combo-card {
  border: 1px solid #ebeef5;
  border-radius: 16px;
  background: #ffffff;
}

.combo-badge {
  background: rgba(64, 158, 255, 0.12) !important;
  color: #409eff !important;
}

.combo-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 12px;
}

.combo-card-btn {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.04);
    transform: translateY(-1px);
    box-shadow: 0 8px 16px -14px rgba(64, 158, 255, 0.55);
  }
}

.combo-icon {
  font-size: 22px;
  line-height: 1;
  text-align: center;
}

.combo-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 13px;
    font-weight: 700;
    color: #303133;
  }

  span {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
    word-break: break-word;
  }
}

.combo-count {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.library-card {
  position: sticky;
  top: 0;
}

.builder-canvas {
  padding: 16px;
  background: linear-gradient(180deg, #fafbfc 0%, #ffffff 220px);
}

.panel-head,
.canvas-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  // 2026-05-25 子項目 min-width: 0 + flex-wrap，避免 canvas 寬度被擠時中文直書
  flex-wrap: wrap;
}

.panel-head > *,
.canvas-head > * {
  min-width: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  white-space: nowrap;
}

.panel-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
  word-break: break-word;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(234, 85, 4, 0.08);
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.canvas-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.canvas-stats span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #ebeef5;
}

.template-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 14px;
}

.template-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #ffffff;
  cursor: grab;
  text-align: left;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.04);
    transform: translateY(-1px);
    box-shadow: 0 10px 18px -14px rgba(234, 85, 4, 0.55);
  }

  &:active {
    cursor: grabbing;
  }
}

.template-info {
  padding: 12px;
}

.template-label {
  font-size: 13px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.template-thumb {
  width: 100%;
  height: 88px;
  padding: 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  box-sizing: border-box;
  transition: background 0.2s ease;
}

.thumb-bar {
  display: block;
  border-radius: 2px;
}

.bar-h1 {
  height: 8px;
  width: 60%;
  background: #303133;
  margin-bottom: 4px;
}

.bar-shadow {
  height: 14px;
  width: 80%;
  background: rgba(234, 85, 4, 0.15);
}

.bar-h2 {
  height: 4px;
  width: 40%;
  background: #606266;
  margin-bottom: 4px;
}

.bar-line {
  height: 3px;
  background: rgba(0, 0, 0, 0.18);
  margin-bottom: 3px;
}

.bar-cta {
  height: 6px;
  width: 36%;
  background: #ea5504;
  border-radius: 3px;
  margin-top: 2px;
}

.w-100 {
  width: 100%;
}

.w-85 {
  width: 85%;
}

.w-70 {
  width: 70%;
}

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
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.thumb-mini-card .thumb-bar {
  width: 80%;
  margin: 0;
}

.thumb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ea5504;
  flex-shrink: 0;
}

.thumb-image {
  width: 50px;
  height: 50px;
  background: #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #606266;
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
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.thumb-cta-mini .bar-h2 {
  width: 70%;
}

.guide-card {
  background: #fff7f0;
  border-style: dashed;
  border-color: rgba(234, 85, 4, 0.35);
}

.guide-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #ea5504;
}

.guide-card p {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.guide-card p:last-child {
  margin-bottom: 0;
}

// 2026-05-25 drop zone 重新設計：
//   default — 細線 12px 高，不擋視線
//   拖拽中（.is-dragging-mode .drop-zone）— 撐高 56px，明顯橘虛線
//   active hover — 實心橘 + ↧ 提示，hold-it-here
.drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12px;
  margin: 4px 0;
  border: 1px dashed transparent;
  border-radius: 12px;
  background: transparent;
  color: transparent;
  font-size: 12px;
  transition: min-height 0.18s ease, border-color 0.18s ease,
    background-color 0.18s ease, color 0.18s ease;
  pointer-events: auto;

  &.compact {
    min-height: 8px;
    margin: 2px 0;
  }

  .drop-zone-text {
    transition: opacity 0.18s ease;
    opacity: 0;
    pointer-events: none;
  }
}

.builder-canvas.is-dragging-mode .drop-zone {
  min-height: 56px;
  border-color: rgba(234, 85, 4, 0.35);
  background: rgba(234, 85, 4, 0.04);
  color: #ea5504;
  font-weight: 600;

  .drop-zone-text {
    opacity: 1;
  }

  &.compact {
    min-height: 48px;
  }

  &.active {
    border-style: solid;
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.14);
    color: #ea5504;
    transform: scale(1.01);
    box-shadow: 0 6px 16px -10px rgba(234, 85, 4, 0.5);

    .drop-zone-text {
      font-size: 14px;
    }
  }
}

.empty-state {
  padding: 34px 20px;
  margin: 12px 0;
  text-align: center;
  color: #909399;
  background: #ffffff;
  border: 1px dashed #dcdfe6;
  border-radius: 16px;
}

.empty-state strong {
  display: block;
  margin-bottom: 8px;
  color: #303133;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.is-dragging) {
  opacity: 0.45;
}

// 2026-05-25 把單欄斷點往上提 — 預覽窗開著時 builder-shell 容易被擠到 canvas 只剩 ~30px，標題會被中文逐字斷直書
@media (max-width: 1440px) {
  .builder-shell {
    grid-template-columns: 1fr;
  }

  .library-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .builder-canvas,
  .library-card,
  .guide-card {
    padding: 14px;
  }

  .panel-head,
  .canvas-head {
    flex-direction: column;
  }

  .canvas-stats {
    justify-content: flex-start;
  }
}
</style>
