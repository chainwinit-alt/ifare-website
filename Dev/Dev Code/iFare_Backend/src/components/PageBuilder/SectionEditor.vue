<template>
  <div
    class="section-editor"
    :class="[
      `type-${section.type}`,
      {
        'is-empty': isEmpty,
        'is-selected': selected,
        'is-collapsed': collapsed,
      },
    ]"
    :draggable="true"
    @click="emit('select')"
    @dragstart="emit('dragstart', $event)"
    @dragover.prevent="emit('dragover', $event)"
    @dragend="emit('dragend', $event)"
    @drop.prevent="emit('drop', $event)"
  >
    <div class="section-toolbar">
      <span class="section-handle" title="拖曳排序" aria-hidden="true">⋮⋮</span>

      <div class="section-meta">
        <span class="meta-icon">{{ SECTION_TYPE_META[section.type].icon }}</span>
        <div class="meta-copy">
          <div class="meta-label-row">
            <span class="meta-label">{{ SECTION_TYPE_META[section.type].label }}</span>
            <span v-if="selected" class="meta-badge">編輯中</span>
            <span v-else-if="isEmpty" class="meta-badge warn">待補內容</span>
          </div>
          <p class="meta-summary">{{ summaryText }}</p>
        </div>
      </div>

      <div class="section-actions">
        <el-button
          :icon="collapsed ? ArrowDown : ArrowUp"
          size="small"
          circle
          plain
          @click.stop="emit('toggleCollapse')"
          :title="collapsed ? '展開編輯' : '收合區塊'"
        />
        <el-button :icon="CopyDocument" size="small" circle plain @click.stop="emit('duplicate')" title="複製區塊" />
        <el-button :icon="Top" size="small" circle :disabled="!canMoveUp" @click.stop="emit('moveUp')" title="往上移動" />
        <el-button
          :icon="Bottom"
          size="small"
          circle
          :disabled="!canMoveDown"
          @click.stop="emit('moveDown')"
          title="往下移動"
        />
        <el-button :icon="Delete" size="small" circle type="danger" plain @click.stop="emit('remove')" title="刪除區塊" />
      </div>
    </div>

    <div v-if="collapsed" class="collapsed-note">
      點一下展開這個區塊，或直接拖曳調整順序。
    </div>

    <div v-else class="section-form" @click.stop>
      <template v-if="section.type === 'hero'">
        <div class="item-row">
          <label class="item-label">主標題</label>
          <el-input v-model="section.title" placeholder="例如：公益夥伴、最新消息、關於我們" size="large" />
        </div>
        <div class="item-row">
          <label class="item-label">大字陰影</label>
          <el-input
            v-model="section.shadowText"
            placeholder="例如：PARTNER / NEWS / ABOUT"
            size="large"
            maxlength="20"
          />
          <span class="item-hint">這會顯示成背景大字，建議使用英文或短字詞。</span>
        </div>
        <div class="item-row">
          <label class="item-label">副標文案</label>
          <el-input v-model="section.subtitle" placeholder="補充一句簡短說明，可留空" />
        </div>
      </template>

      <template v-else-if="section.type === 'text-section'">
        <div class="item-row">
          <label class="item-label">段落標題</label>
          <el-input v-model="section.title" placeholder="例如：關於我們、服務內容、申請方式" size="large" />
        </div>
        <div class="paragraphs-list">
          <div v-for="(_, idx) in section.paragraphs" :key="idx" class="paragraph-row">
            <span class="paragraph-num">{{ idx + 1 }}</span>
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
              title="刪除這一段"
            />
          </div>
        </div>
        <el-button :icon="Plus" size="small" plain @click="addParagraph">
          新增一段
        </el-button>
      </template>

      <template v-else-if="section.type === 'four-card'">
        <div class="item-row">
          <label class="item-label">區塊標題</label>
          <el-input v-model="section.title" placeholder="例如：四個行動方向、我們正在做的事" />
        </div>

        <div class="cards-grid">
          <div v-for="(card, idx) in section.cards" :key="idx" class="card-edit">
            <div class="card-edit-header">
              <span class="card-num">卡片 {{ idx + 1 }}</span>
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
            <el-input v-model="card.description" type="textarea" :rows="2" placeholder="卡片說明文字" />
          </div>
        </div>

        <el-button :icon="Plus" size="small" plain :disabled="section.cards.length >= 6" @click="addCard">
          新增卡片
        </el-button>
      </template>

      <template v-else-if="section.type === 'image-text'">
        <div class="item-row">
          <label class="item-label">圖片位置</label>
          <el-radio-group v-model="section.imagePosition" size="default">
            <el-radio-button label="left">圖片在左</el-radio-button>
            <el-radio-button label="right">圖片在右</el-radio-button>
          </el-radio-group>
        </div>

        <div class="item-row">
          <label class="item-label">圖片網址</label>
          <el-input v-model="section.imageSrc" placeholder="https://... 或 /img/..." />
          <div class="image-source-actions">
            <el-button :icon="Upload" size="small" plain :loading="uploadingImage" @click="triggerImageFileSelect">
              選擇本機圖片
            </el-button>
            <el-button v-if="isEmbeddedImage" size="small" text @click="clearSelectedImage">
              清除已選圖片
            </el-button>
            <input
              ref="imageFileInput"
              class="image-file-input"
              type="file"
              accept="image/*"
              @change="onImageFileChange"
            />
          </div>
          <span class="item-hint">本機 C:\... 路徑無法直接預覽，請使用公開網址、assets/img/...，或按「選擇本機圖片」。</span>
          <span v-if="isLocalImagePath" class="item-warning">偵測到本機檔案路徑，瀏覽器無法直接載入這種路徑。</span>
        </div>

        <div class="item-row">
          <label class="item-label">圖片替代文字</label>
          <el-input v-model="section.imageAlt" placeholder="提供給無障礙與 SEO 的說明文字" />
        </div>

        <div v-if="section.imageSrc" class="image-preview">
          <img :src="section.imageSrc" :alt="section.imageAlt" />
        </div>

        <div class="item-row">
          <label class="item-label">段落標題</label>
          <el-input v-model="section.title" placeholder="圖片旁的標題" size="large" />
        </div>

        <div class="item-row">
          <label class="item-label">段落內容</label>
          <el-input v-model="section.content" type="textarea" :rows="4" placeholder="圖片旁的說明文字" />
        </div>

        <div class="item-row two-col">
          <div>
            <label class="item-label">按鈕文字</label>
            <el-input v-model="section.ctaText" placeholder="例如：了解更多" />
          </div>
          <div>
            <label class="item-label">按鈕連結</label>
            <el-input v-model="section.ctaUrl" placeholder="/page 或 https://..." />
          </div>
        </div>
      </template>

      <template v-else-if="section.type === 'cta-card'">
        <div class="cta-cards-list">
          <div v-for="(card, idx) in section.cards" :key="idx" class="cta-card-edit">
            <div class="cta-card-header">
              <span class="card-num">行動卡 {{ idx + 1 }}</span>
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

            <el-input v-model="card.title" placeholder="卡片標題" size="large" />
            <div class="two-col">
              <el-input v-model="card.ctaText" placeholder="按鈕文字" />
              <el-input v-model="card.ctaUrl" placeholder="按鈕連結" />
            </div>
          </div>
        </div>

        <el-button :icon="Plus" size="small" plain :disabled="section.cards.length >= 3" @click="addCtaCard">
          新增行動卡
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElButton, ElInput, ElMessage, ElRadioButton, ElRadioGroup } from 'element-plus';
import {
  ArrowDown,
  ArrowUp,
  Bottom,
  CopyDocument,
  Delete,
  Plus,
  Top,
  Upload,
} from '@element-plus/icons-vue';
import {
  ICON_OPTIONS,
  SECTION_TYPE_META,
  isSectionEmpty,
  type Section,
} from '@/composables/useDynamicPages';

const props = defineProps<{
  modelValue: Section;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selected: boolean;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
  (e: 'duplicate'): void;
  (e: 'remove'): void;
  (e: 'select'): void;
  (e: 'toggleCollapse'): void;
  (e: 'dragstart', ev: DragEvent): void;
  (e: 'dragover', ev: DragEvent): void;
  (e: 'dragend', ev: DragEvent): void;
  (e: 'drop', ev: DragEvent): void;
}>();

const section = computed(() => props.modelValue);
const isEmpty = computed(() => isSectionEmpty(section.value));
const imageFileInput = ref<HTMLInputElement | null>(null);
const uploadingImage = ref(false);
const FRONTEND_ASSET_UPLOAD_URL =
  (import.meta.env.VITE_FRONTEND_ASSET_UPLOAD_URL as string | undefined) ||
  'http://localhost:3000/api/dynamic-assets';
const FRONTEND_DYNAMIC_API_TOKEN = (import.meta.env.VITE_FRONTEND_DYNAMIC_API_TOKEN as string | undefined) || '';
const MAX_IMAGE_UPLOAD_SIZE = 8 * 1024 * 1024;
const isEmbeddedImage = computed(() => section.value.type === 'image-text' && section.value.imageSrc.startsWith('data:image/'));
const isLocalImagePath = computed(() => (
  section.value.type === 'image-text' &&
  /^(["']?)([a-zA-Z]:\\|[a-zA-Z]:\/|\\\\|file:\/\/)/.test(section.value.imageSrc.trim())
));

const summaryText = computed(() => {
  const current = section.value;

  switch (current.type) {
    case 'hero':
      return joinFilled([
        current.title || '尚未設定主標題',
        current.shadowText ? `背景大字：${current.shadowText}` : '',
        current.subtitle || '',
      ]);

    case 'text-section': {
      const firstParagraph = current.paragraphs.find((paragraph) => paragraph.trim());
      return joinFilled([
        current.title || '尚未設定段落標題',
        firstParagraph || `共 ${current.paragraphs.length} 段文字`,
      ]);
    }

    case 'four-card': {
      const filledCards = current.cards.filter((card) => card.title.trim()).length;
      return joinFilled([
        current.title || '四欄卡片區塊',
        `${filledCards || current.cards.length} 張卡片`,
      ]);
    }

    case 'image-text':
      return joinFilled([
        current.title || '尚未設定段落標題',
        current.imageSrc ? `圖片在${current.imagePosition === 'left' ? '左側' : '右側'}` : '尚未設定圖片',
        current.ctaText ? `按鈕：${current.ctaText}` : '',
      ]);

    case 'cta-card': {
      const filledCards = current.cards.filter((card) => card.title.trim()).length;
      return joinFilled([
        `${filledCards || current.cards.length} 張行動卡`,
        current.cards.map((card) => card.title).find((title) => title.trim()) || '',
      ]);
    }
  }
});

function joinFilled(values: string[]) {
  const filled = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return filled.length > 0 ? filled.join(' / ') : '尚未設定內容';
}

function addParagraph() {
  if (section.value.type === 'text-section') {
    section.value.paragraphs.push('');
  }
}

function removeParagraph(idx: number) {
  if (section.value.type === 'text-section' && section.value.paragraphs.length > 1) {
    section.value.paragraphs.splice(idx, 1);
  }
}

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

function triggerImageFileSelect() {
  imageFileInput.value?.click();
}

function clearSelectedImage() {
  if (section.value.type !== 'image-text') return;
  section.value.imageSrc = '';
}

async function uploadImageFile(file: File) {
  const formData = new FormData();
  const headers: Record<string, string> = {};
  formData.append('file', file);

  if (FRONTEND_DYNAMIC_API_TOKEN) {
    headers['X-iFare-Sync-Token'] = FRONTEND_DYNAMIC_API_TOKEN;
  }

  const response = await fetch(FRONTEND_ASSET_UPLOAD_URL, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<{ url?: string; path?: string }>;
}

async function onImageFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('請選擇圖片檔案');
    input.value = '';
    return;
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    ElMessage.warning('圖片不可超過 8MB，請壓縮後再上傳');
    input.value = '';
    return;
  }

  uploadingImage.value = true;

  try {
    const result = await uploadImageFile(file);
    if (section.value.type !== 'image-text') return;

    section.value.imageSrc = result.url || result.path || '';
    if (!section.value.imageAlt.trim()) {
      section.value.imageAlt = file.name.replace(/\.[^.]+$/, '');
    }
    ElMessage.success('圖片已上傳，儲存頁面時會保留圖片網址');
  } catch (err) {
    console.warn('[PageBuilder] image upload failed', err);
    ElMessage.error('圖片上傳失敗，請確認前台 dev server 已啟動');
  } finally {
    uploadingImage.value = false;
    input.value = '';
  }
}
</script>

<style lang="scss" scoped>
.section-editor {
  position: relative;
  margin-bottom: 12px;
  padding: 16px 18px;
  border: 1px solid #e4e7ed;
  border-radius: 14px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: #ea5504;
    box-shadow: 0 8px 18px -14px rgba(234, 85, 4, 0.45);
    transform: translateY(-1px);
  }

  &.is-empty {
    border-color: #e6a23c;
    background: #fffaf2;
  }

  &.is-selected {
    border-color: #ea5504;
    box-shadow: 0 12px 28px -18px rgba(234, 85, 4, 0.5);
  }

  &.is-collapsed {
    padding-bottom: 12px;
  }
}

.section-toolbar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.section-handle {
  cursor: grab;
  color: #c0c4cc;
  font-size: 14px;
  line-height: 1;
  letter-spacing: -2px;
  user-select: none;
  padding-top: 6px;

  &:active {
    cursor: grabbing;
  }
}

.section-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.meta-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(234, 85, 4, 0.08);
  font-size: 18px;
  flex-shrink: 0;
}

.meta-copy {
  min-width: 0;
}

.meta-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.meta-label {
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(234, 85, 4, 0.08);
  color: #ea5504;
  font-size: 12px;
  font-weight: 600;

  &.warn {
    background: rgba(230, 162, 60, 0.12);
    color: #c98512;
  }
}

.meta-summary {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.section-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.collapsed-note {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  color: #909399;
  font-size: 13px;
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ebeef5;
}

.item-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}

.item-label {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.item-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.item-warning {
  font-size: 12px;
  color: #c45656;
  line-height: 1.6;
}

.image-source-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.image-file-input {
  display: none;
}

.paragraphs-list,
.cta-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.paragraph-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.paragraph-num {
  flex-shrink: 0;
  width: 28px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f5f7fa;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card-edit,
.cta-card-edit {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-edit-header,
.cta-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-num {
  color: #909399;
  font-size: 12px;
  font-weight: 600;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  transition: all 0.2s ease;

  &:hover {
    border-color: #ea5504;
    color: #ea5504;
  }

  &.active {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.1);
    color: #ea5504;
  }
}

.icon-svg :deep(svg) {
  width: 18px;
  height: 18px;
}

.image-preview {
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  background: #f5f7fa;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 768px) {
  .section-toolbar {
    flex-wrap: wrap;
  }

  .section-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .cards-grid,
  .two-col,
  .item-row.two-col {
    grid-template-columns: 1fr;
  }

  .paragraph-row {
    flex-wrap: wrap;
  }

  .paragraph-num {
    width: 32px;
  }
}
</style>
