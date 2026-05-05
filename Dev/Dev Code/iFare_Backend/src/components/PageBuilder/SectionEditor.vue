<template>
  <!--
    UIUX 動態頁 CMS — 單一 section 編輯器 (v2 範本式)
    依 section.type 切換到對應的範本表單
  -->
  <div
    class="section-editor"
    :class="[`type-${section.type}`, { 'is-empty': isEmpty }]"
    :draggable="true"
    @dragstart="emit('dragstart', $event)"
    @dragover.prevent="emit('dragover', $event)"
    @dragend="emit('dragend', $event)"
    @drop.prevent="emit('drop', $event)"
  >
    <!-- Toolbar -->
    <div class="section-toolbar">
      <span class="section-handle" title="拖拉排序" aria-hidden="true">⋮⋮</span>
      <div class="section-meta">
        <span class="meta-icon">{{ SECTION_TYPE_META[section.type].icon }}</span>
        <span class="meta-label">{{ SECTION_TYPE_META[section.type].label }}</span>
        <span v-if="isEmpty" class="empty-warn" title="此區段內容尚未填寫">⚠</span>
      </div>
      <div class="section-actions">
        <el-button :icon="CopyDocument" size="small" circle plain @click="emit('duplicate')" title="複製" />
        <el-button :icon="Top" size="small" circle :disabled="!canMoveUp" @click="emit('moveUp')" title="上移" />
        <el-button :icon="Bottom" size="small" circle :disabled="!canMoveDown" @click="emit('moveDown')" title="下移" />
        <el-button :icon="Delete" size="small" circle type="danger" plain @click="emit('remove')" title="刪除" />
      </div>
    </div>

    <!-- ── Hero ── -->
    <template v-if="section.type === 'hero'">
      <div class="section-form">
        <div class="item-row">
          <label class="item-label">中文主標題</label>
          <el-input v-model="section.title" placeholder="例：公益夥伴 / 最新消息" size="large" />
        </div>
        <div class="item-row">
          <label class="item-label">英文陰影副標</label>
          <el-input v-model="section.shadowText" placeholder="例：PARTNER / NEWS / ARTICLE" size="large" maxlength="20" />
          <span class="item-hint">會以淡色大字呈現於主標題後方（裝飾用）</span>
        </div>
        <div class="item-row">
          <label class="item-label">副標 (選填)</label>
          <el-input v-model="section.subtitle" placeholder="例：找尋適合您的社會福利" />
        </div>
      </div>
    </template>

    <!-- ── Text Section ── -->
    <template v-else-if="section.type === 'text-section'">
      <div class="section-form">
        <div class="item-row">
          <label class="item-label">區段標題 (h2)</label>
          <el-input v-model="section.title" placeholder="例：關於我們、服務內容..." size="large" />
        </div>
        <div class="paragraphs-list">
          <div v-for="(_, idx) in section.paragraphs" :key="idx" class="paragraph-row">
            <span class="paragraph-num">{{ idx + 1 }}.</span>
            <el-input
              v-model="section.paragraphs[idx]"
              type="textarea"
              :rows="3"
              :placeholder="`第 ${idx + 1} 段內容`"
            />
            <el-button
              :icon="Delete"
              size="small"
              circle
              type="danger"
              plain
              :disabled="section.paragraphs.length <= 1"
              @click="removeParagraph(idx)"
              title="刪除此段"
            />
          </div>
        </div>
        <el-button :icon="Plus" size="small" plain @click="addParagraph">
          新增段落
        </el-button>
      </div>
    </template>

    <!-- ── Four Card ── -->
    <template v-else-if="section.type === 'four-card'">
      <div class="section-form">
        <div class="item-row">
          <label class="item-label">區段標題 (選填)</label>
          <el-input v-model="section.title" placeholder="例：四個行動方向" />
        </div>
        <div class="cards-grid">
          <div v-for="(card, idx) in section.cards" :key="idx" class="card-edit">
            <div class="card-edit-header">
              <span class="card-num">第 {{ idx + 1 }} 張</span>
              <el-button
                :icon="Delete"
                size="small"
                circle
                type="danger"
                plain
                :disabled="section.cards.length <= 1"
                @click="removeCard(idx)"
              />
            </div>
            <div class="icon-picker">
              <button
                v-for="opt in ICON_OPTIONS"
                :key="opt.key"
                type="button"
                class="icon-btn"
                :class="{ active: card.icon === opt.key }"
                :title="opt.label"
                @click="card.icon = opt.key"
              >
                <span class="icon-svg" v-html="opt.svg" />
              </button>
            </div>
            <el-input v-model="card.title" placeholder="卡片標題" />
            <el-input v-model="card.description" type="textarea" :rows="2" placeholder="卡片描述" />
          </div>
        </div>
        <el-button :icon="Plus" size="small" plain :disabled="section.cards.length >= 6" @click="addCard">
          新增卡片（最多 6 張）
        </el-button>
      </div>
    </template>

    <!-- ── Image Text ── -->
    <template v-else-if="section.type === 'image-text'">
      <div class="section-form">
        <div class="item-row">
          <label class="item-label">圖片位置</label>
          <el-radio-group v-model="section.imagePosition" size="default">
            <el-radio-button label="left">圖左 / 文右</el-radio-button>
            <el-radio-button label="right">圖右 / 文左</el-radio-button>
          </el-radio-group>
        </div>
        <div class="item-row">
          <label class="item-label">圖片網址</label>
          <el-input v-model="section.imageSrc" placeholder="https://... 或 /img/..." />
        </div>
        <div class="item-row">
          <label class="item-label">圖片替代文字</label>
          <el-input v-model="section.imageAlt" placeholder="無障礙必填" />
        </div>
        <div v-if="section.imageSrc" class="image-preview">
          <img :src="section.imageSrc" :alt="section.imageAlt" />
        </div>
        <div class="item-row">
          <label class="item-label">標題</label>
          <el-input v-model="section.title" placeholder="段落標題" size="large" />
        </div>
        <div class="item-row">
          <label class="item-label">內文</label>
          <el-input v-model="section.content" type="textarea" :rows="4" placeholder="段落內容" />
        </div>
        <div class="item-row two-col">
          <div>
            <label class="item-label">CTA 文字 (選填)</label>
            <el-input v-model="section.ctaText" placeholder="例：了解更多" />
          </div>
          <div>
            <label class="item-label">CTA 連結 (選填)</label>
            <el-input v-model="section.ctaUrl" placeholder="/page 或 https://..." />
          </div>
        </div>
      </div>
    </template>

    <!-- ── Cta Card ── -->
    <template v-else-if="section.type === 'cta-card'">
      <div class="section-form">
        <div class="cta-cards-list">
          <div v-for="(card, idx) in section.cards" :key="idx" class="cta-card-edit">
            <div class="cta-card-header">
              <span class="card-num">第 {{ idx + 1 }} 卡</span>
              <el-button
                :icon="Delete"
                size="small"
                circle
                type="danger"
                plain
                :disabled="section.cards.length <= 1"
                @click="removeCtaCard(idx)"
              />
            </div>
            <el-input v-model="card.title" placeholder="說明文字" size="large" />
            <div class="two-col">
              <el-input v-model="card.ctaText" placeholder="按鈕文字 (例：前往 i-Fare)" />
              <el-input v-model="card.ctaUrl" placeholder="連結 (/ifare)" />
            </div>
          </div>
        </div>
        <el-button :icon="Plus" size="small" plain :disabled="section.cards.length >= 3" @click="addCtaCard">
          新增 CTA 卡（最多 3）
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  ElButton,
  ElInput,
  ElRadioGroup,
  ElRadioButton,
} from 'element-plus';
import { Top, Bottom, Delete, Plus, CopyDocument } from '@element-plus/icons-vue';
import {
  type Section,
  SECTION_TYPE_META,
  ICON_OPTIONS,
  isSectionEmpty,
} from '@/composables/useDynamicPages';

// Vue 3.3 不支援 defineModel — 用 props (Vue reactive proxy 允許巢狀 mutate)
const props = defineProps<{
  modelValue: Section;
  canMoveUp: boolean;
  canMoveDown: boolean;
}>();

const emit = defineEmits<{
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
  (e: 'duplicate'): void;
  (e: 'remove'): void;
  (e: 'dragstart', ev: DragEvent): void;
  (e: 'dragover', ev: DragEvent): void;
  (e: 'dragend', ev: DragEvent): void;
  (e: 'drop', ev: DragEvent): void;
}>();

// alias
const section = computed(() => props.modelValue);

const isEmpty = computed(() => isSectionEmpty(section.value));

// ── Text Section ──
function addParagraph() {
  if (section.value.type === 'text-section') section.value.paragraphs.push('');
}
function removeParagraph(idx: number) {
  if (section.value.type === 'text-section' && section.value.paragraphs.length > 1) {
    section.value.paragraphs.splice(idx, 1);
  }
}

// ── Four Card ──
function addCard() {
  if (section.value.type === 'four-card' && section.value.cards.length < 6) {
    section.value.cards.push({ icon: 'star', title: '', description: '' });
  }
}
function removeCard(idx: number) {
  if (section.value.type === 'four-card' && section.value.cards.length > 1) {
    section.value.cards.splice(idx, 1);
  }
}

// ── Cta Card ──
function addCtaCard() {
  if (section.value.type === 'cta-card' && section.value.cards.length < 3) {
    section.value.cards.push({ title: '', ctaText: '', ctaUrl: '' });
  }
}
function removeCtaCard(idx: number) {
  if (section.value.type === 'cta-card' && section.value.cards.length > 1) {
    section.value.cards.splice(idx, 1);
  }
}
</script>

<style lang="scss" scoped>
.section-editor {
  position: relative;
  margin-bottom: 12px;
  padding: 14px 16px;
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  background: #FFFFFF;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: #EA5504;
    box-shadow: 0 2px 8px rgba(234, 85, 4, 0.08);
  }

  &.is-empty {
    border-color: #E6A23C;
    background: #FDF6EC;
  }
}

.section-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #E4E7ED;
}

.section-handle {
  cursor: grab;
  color: #C0C4CC;
  font-size: 12px;
  letter-spacing: -2px;
  user-select: none;
  &:active { cursor: grabbing; }
}

.section-meta {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;

  .meta-icon { font-size: 16px; }
  .meta-label {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
  }
  .empty-warn { color: #E6A23C; font-size: 14px; }
}

.section-actions {
  display: flex;
  gap: 4px;
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.item-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

.item-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.item-hint {
  font-size: 12px;
  color: #909399;
}

.paragraphs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paragraph-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .paragraph-num {
    flex-shrink: 0;
    width: 24px;
    text-align: right;
    color: #909399;
    font-size: 14px;
    line-height: 32px;
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card-edit {
  padding: 10px 12px;
  border: 1px solid #E4E7ED;
  border-radius: 6px;
  background: #FAFBFC;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .card-edit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-num {
    font-size: 12px;
    color: #909399;
  }
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .icon-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid #DCDFE6;
    background: #FFFFFF;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #606266;
    transition: all 0.2s ease;

    &:hover { border-color: #EA5504; color: #EA5504; }
    &.active {
      border-color: #EA5504;
      background: rgba(234, 85, 4, 0.1);
      color: #EA5504;
    }

    .icon-svg :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }
}

.image-preview {
  padding: 8px;
  border: 1px dashed #DCDFE6;
  border-radius: 4px;
  background: #F5F7FA;
  text-align: center;

  img { max-width: 100%; max-height: 200px; object-fit: contain; }
}

.cta-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cta-card-edit {
  padding: 12px;
  border: 1px solid #E4E7ED;
  border-radius: 6px;
  background: #FAFBFC;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .cta-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-num {
    font-size: 12px;
    color: #909399;
  }
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (max-width: 768px) {
  .cards-grid,
  .two-col,
  .item-row.two-col {
    grid-template-columns: 1fr;
  }
}
</style>
