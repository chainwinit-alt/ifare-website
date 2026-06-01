<template>
  <!-- 2026-05-25 #96 LinkPicker — 站內連結 / 動態頁 / 外部 URL 三選一，防呆按鈕連結 -->
  <div class="link-picker">
    <el-input v-model="localValue" :placeholder="placeholder" size="default">
      <template #append>
        <el-button :icon="Link" @click="openDialog" title="從頁面挑選">挑連結</el-button>
      </template>
    </el-input>

    <el-dialog
      v-model="dialogOpen"
      title="挑選連結"
      width="640px"
      top="8vh"
      destroy-on-close
      append-to-body
    >
      <el-tabs v-model="activeTab">
        <!-- 動態頁 -->
        <el-tab-pane name="dynamic">
          <template #label>
            <span>📄 後台動態頁 <el-tag size="small">{{ dynamicPages.length }}</el-tag></span>
          </template>
          <div class="picker-search">
            <el-input v-model="searchDynamic" placeholder="搜尋頁面名稱或網址" clearable :prefix-icon="Search" />
          </div>
          <div class="picker-list">
            <button
              v-for="page in filteredDynamic"
              :key="page.id"
              type="button"
              class="picker-item"
              :class="{ active: localValue === `/${page.slug}` }"
              @click="selectAndClose(`/${page.slug}`)"
            >
              <div class="picker-item-main">
                <strong>{{ page.title || '(未命名)' }}</strong>
                <code>/{{ page.slug }}</code>
              </div>
              <el-tag :type="page.status === 'published' ? 'success' : 'warning'" size="small">
                {{ page.status === 'published' ? '已發布' : page.status === 'draft' ? '草稿' : '已下架' }}
              </el-tag>
            </button>
            <div v-if="filteredDynamic.length === 0" class="picker-empty">
              {{ searchDynamic ? '沒有符合的動態頁' : '尚未建立任何動態頁，先去「頁面管理」建一個' }}
            </div>
          </div>
        </el-tab-pane>

        <!-- 站內固定頁 -->
        <el-tab-pane name="builtin">
          <template #label>
            <span>🏠 站內固定頁</span>
          </template>
          <div class="picker-list">
            <button
              v-for="item in BUILTIN_PAGES"
              :key="item.path"
              type="button"
              class="picker-item"
              :class="{ active: localValue === item.path }"
              @click="selectAndClose(item.path)"
            >
              <div class="picker-item-main">
                <strong>{{ item.label }}</strong>
                <code>{{ item.path }}</code>
                <span class="picker-item-desc">{{ item.description }}</span>
              </div>
            </button>
          </div>
        </el-tab-pane>

        <!-- 外部連結 -->
        <el-tab-pane name="external">
          <template #label>
            <span>🌐 外部連結</span>
          </template>
          <div class="external-form">
            <label>輸入完整網址（必須以 https:// 或 http:// 開頭）</label>
            <el-input
              v-model="externalUrl"
              placeholder="例如：https://www.example.com/event"
              size="large"
              @keyup.enter="confirmExternal"
            />
            <span v-if="externalError" class="external-error">{{ externalError }}</span>
            <div class="external-actions">
              <el-button @click="dialogOpen = false">取消</el-button>
              <el-button type="primary" @click="confirmExternal">使用這個網址</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  ElButton,
  ElDialog,
  ElInput,
  ElTabs,
  ElTabPane,
  ElTag,
} from 'element-plus';
import { Link, Search } from '@element-plus/icons-vue';
import { useDynamicPages } from '@/composables/useDynamicPages';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const localValue = computed({
  get: () => props.modelValue || '',
  set: (v) => emit('update:modelValue', v),
});

const dialogOpen = ref(false);
const activeTab = ref<'dynamic' | 'builtin' | 'external'>('dynamic');
const searchDynamic = ref('');
const externalUrl = ref('');
const externalError = ref('');

const { pages } = useDynamicPages();

const dynamicPages = computed(() => pages.value.filter((p) => p.slug?.trim()));

const filteredDynamic = computed(() => {
  const kw = searchDynamic.value.trim().toLowerCase();
  if (!kw) return dynamicPages.value;
  return dynamicPages.value.filter(
    (p) =>
      (p.title || '').toLowerCase().includes(kw) || (p.slug || '').toLowerCase().includes(kw),
  );
});

// 站內固定頁清單（前台 Nuxt pages）— 後續可改成從 config 讀
const BUILTIN_PAGES = [
  { path: '/', label: '首頁', description: '網站入口' },
  { path: '/about', label: '關於我們', description: '基金會介紹頁' },
  { path: '/news', label: '最新消息', description: '消息列表' },
  { path: '/collaborator', label: '公益夥伴', description: '合作單位列表' },
  { path: '/ifare', label: 'i-Fare 福利查詢', description: '主要服務頁' },
  { path: '/contact', label: '聯絡我們', description: '聯絡表單 / 資訊' },
  { path: '/future', label: '未來規劃', description: '未來計畫展示' },
];

function openDialog() {
  // 預判目前值屬於哪一類，自動切到對應 tab
  const v = localValue.value.trim();
  if (/^https?:\/\//i.test(v)) {
    activeTab.value = 'external';
    externalUrl.value = v;
  } else if (v && BUILTIN_PAGES.some((p) => p.path === v)) {
    activeTab.value = 'builtin';
  } else {
    activeTab.value = 'dynamic';
  }
  externalError.value = '';
  searchDynamic.value = '';
  dialogOpen.value = true;
}

function selectAndClose(value: string) {
  localValue.value = value;
  dialogOpen.value = false;
}

function confirmExternal() {
  const v = externalUrl.value.trim();
  if (!v) {
    externalError.value = '請輸入網址';
    return;
  }
  if (!/^https?:\/\//i.test(v)) {
    externalError.value = '網址需以 https:// 或 http:// 開頭';
    return;
  }
  externalError.value = '';
  selectAndClose(v);
}

watch(dialogOpen, (open) => {
  if (!open) externalError.value = '';
});
</script>

<style lang="scss" scoped>
.link-picker {
  width: 100%;
}

.picker-search {
  margin-bottom: 12px;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 50vh;
  overflow-y: auto;
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;

  &:hover {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.04);
    transform: translateY(-1px);
  }

  &.active {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.08);
  }
}

.picker-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
  }

  code {
    font-size: 12px;
    color: #0f4c5c;
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    width: fit-content;
  }
}

.picker-item-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.picker-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
  background: #fafbfc;
  border: 1px dashed #dcdfe6;
  border-radius: 10px;
}

.external-form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
  }
}

.external-error {
  font-size: 12px;
  color: #f56c6c;
}

.external-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>
