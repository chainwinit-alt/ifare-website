<template>
  <main-header />
  <el-scrollbar class="main-scrollbar">
    <div class="home-grid">
      <section class="section-main-card card-fullsize">
        <div class="card-info hero-card">
          <div class="hero-copy">
            <span class="hero-kicker">i-Fare 後台</span>
            <h2 class="hero-title">歡迎回來，{{ displayUserName }}</h2>
            <p class="hero-desc">
              今天是 {{ dateNow }}。這裡整理了常用管理入口，登入後可以直接前往內容維護、i-Fare 資料管理與站內分析。
            </p>
          </div>
          <div class="hero-meta">
            <div class="meta-item">
              <span class="meta-label">目前帳號</span>
              <strong class="meta-value">{{ displayUserName }}</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label">聯絡信箱</span>
              <strong class="meta-value">{{ displayEmail }}</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label">權限</span>
              <strong class="meta-value">{{ displayPermission }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="section-main-card card-fullsize">
        <div class="card-info shortcut-card">
          <div class="shortcut-head">
            <div>
              <h3>快速入口</h3>
              <p>先用搜尋或分組縮小範圍，再直接進模組。</p>
            </div>
            <span class="shortcut-count">{{ filteredShortcuts.length }} / {{ shortcutCards.length }} 個模組</span>
          </div>

          <div class="shortcut-toolbar">
            <el-input
              ref="searchInputRef"
              v-model="searchQuery"
              class="shortcut-search"
              size="large"
              clearable
              :prefix-icon="Search"
              placeholder="搜尋模組、用途或關鍵字，例如：頁面、FAQ、分析"
            />

            <el-button
              v-if="searchQuery || activeGroup !== '全部'"
              size="large"
              plain
              @click="resetFilters"
            >
              清除篩選
            </el-button>
          </div>

          <div class="group-filter-list">
            <button
              v-for="group in shortcutGroups"
              :key="group"
              type="button"
              class="group-chip"
              :class="{ 'is-active': activeGroup === group }"
              @click="activeGroup = group"
            >
              {{ group }}
            </button>
          </div>

          <div v-if="recentShortcuts.length" class="recent-block">
            <div class="recent-head">
              <strong>最近使用</strong>
              <span>下次登入可直接回到剛剛常用的模組</span>
            </div>

            <div class="recent-list">
              <button
                v-for="item in recentShortcuts"
                :key="`recent-${item.routeName}`"
                type="button"
                class="recent-chip"
                @click="goTo(item.routeName)"
              >
                <span>{{ item.title }}</span>
                <small>{{ item.group }}</small>
              </button>
            </div>
          </div>

          <div v-if="filteredShortcuts.length" class="shortcut-grid">
            <button
              v-for="item in filteredShortcuts"
              :key="item.routeName"
              type="button"
              class="shortcut-item"
              @click="goTo(item.routeName)"
            >
              <span class="shortcut-group">{{ item.group }}</span>
              <strong class="shortcut-title">{{ item.title }}</strong>
              <p class="shortcut-desc">{{ item.description }}</p>
              <span v-if="isRecentShortcut(item.routeName)" class="shortcut-flag">最近使用</span>
            </button>
          </div>

          <div v-else class="empty-state">
            <strong>找不到符合條件的模組</strong>
            <p>可以改搜別的關鍵字，或先清除分組與搜尋條件。</p>
          </div>
        </div>
      </section>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElButton, ElInput, ElMessage, ElScrollbar } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

interface ShortcutItem {
  title: string;
  description: string;
  routeName: string;
  group: string;
  keywords: string[];
}

const RECENT_SHORTCUTS_KEY = "ifare-backend-recent-shortcuts";
const router = useRouter();
const userStore = useUserStore();
const searchInputRef = ref<InstanceType<typeof ElInput> | null>(null);
const searchQuery = ref("");
const activeGroup = ref("全部");
const recentRouteNames = ref<string[]>([]);

const shortcutCards: ShortcutItem[] = [
  {
    title: "最新消息",
    description: "管理前台公告與新聞內容。",
    routeName: "News_DataList",
    group: "內容管理",
    keywords: ["news", "公告", "消息", "文章"],
  },
  {
    title: "文章專區",
    description: "維護福利文章與懶人包。",
    routeName: "Articles_Welfare_DataList",
    group: "內容管理",
    keywords: ["福利", "專欄", "文章", "懶人包"],
  },
  {
    title: "i-Fare 政策",
    description: "更新福利政策、條件與發布狀態。",
    routeName: "IFare_Policy_DataList",
    group: "i-Fare",
    keywords: ["政策", "補助", "福利", "條件"],
  },
  {
    title: "常見問答",
    description: "整理 i-Fare FAQ 與客服知識。",
    routeName: "IFare_QA_DataList",
    group: "i-Fare",
    keywords: ["faq", "qa", "客服", "問答"],
  },
  {
    title: "頁面管理",
    description: "管理動態頁面與版型內容。",
    routeName: "PageManagement_DataList",
    group: "CMS",
    keywords: ["cms", "page", "頁面", "版型"],
  },
  {
    title: "數據分析",
    description: "查看訪客、瀏覽與趨勢資料。",
    routeName: "Analysis",
    group: "營運",
    keywords: ["分析", "ga4", "訪客", "流量", "dashboard"],
  },
];

const shortcutGroups = computed(() => [
  "全部",
  ...Array.from(new Set(shortcutCards.map((item) => item.group))),
]);

const filteredShortcuts = computed(() => {
  const normalizedQuery = normalizeText(searchQuery.value);

  return shortcutCards.filter((item) => {
    const groupMatches = activeGroup.value === "全部" || item.group === activeGroup.value;
    if (!groupMatches) return false;

    if (!normalizedQuery) return true;

    const haystack = normalizeText(
      [item.title, item.description, item.group, ...item.keywords].join(" "),
    );
    return haystack.includes(normalizedQuery);
  });
});

const recentShortcuts = computed(() =>
  recentRouteNames.value
    .map((routeName) => shortcutCards.find((item) => item.routeName === routeName))
    .filter((item): item is ShortcutItem => Boolean(item)),
);

const displayUserName = computed(() => userStore.userName || "管理者");
const displayEmail = computed(() => userStore.email || "-");
const displayPermission = computed(() => userStore.permission || "未設定");
const dateNow = computed(() =>
  new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(new Date()),
);

function goTo(routeName: string) {
  rememberShortcut(routeName);
  router.push({ name: routeName });
}

function resetFilters() {
  searchQuery.value = "";
  activeGroup.value = "全部";
}

function isRecentShortcut(routeName: string) {
  return recentRouteNames.value.includes(routeName);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function loadRecentShortcuts() {
  try {
    const saved = window.localStorage.getItem(RECENT_SHORTCUTS_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return;

    recentRouteNames.value = parsed.filter((item) =>
      shortcutCards.some((card) => card.routeName === item),
    );
  } catch {
    recentRouteNames.value = [];
  }
}

function rememberShortcut(routeName: string) {
  const next = [routeName, ...recentRouteNames.value.filter((item) => item !== routeName)].slice(0, 5);
  recentRouteNames.value = next;
  window.localStorage.setItem(RECENT_SHORTCUTS_KEY, JSON.stringify(next));
}

function shortcutHandler(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInputRef.value?.focus();
  }
}

const tokenCheckTask = window.setInterval(() => {
  if (!userStore.tokenExpiredTime) return;

  if (new Date() > new Date(userStore.tokenExpiredTime)) {
    userStore.logout();
    router.push({ name: "Login" });
    ElMessage({
      message: "登入憑證已過期，請重新登入。",
      type: "error",
    });
    window.clearInterval(tokenCheckTask);
  }
}, 1000 * 60 * 3);

onMounted(() => {
  loadRecentShortcuts();
  window.addEventListener("keydown", shortcutHandler);
});

onBeforeUnmount(() => {
  window.clearInterval(tokenCheckTask);
  window.removeEventListener("keydown", shortcutHandler);
});
</script>

<style lang="scss" scoped>
.home-grid {
  display: grid;
  gap: 20px;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  gap: 24px;
  padding: 28px 32px;
}

.hero-kicker {
  display: inline-flex;
  margin-bottom: 12px;
  color: #ea5504;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-title {
  margin: 0 0 10px;
  font-size: 30px;
  line-height: 1.2;
  color: #303133;
}

.hero-desc {
  margin: 0;
  max-width: 640px;
  color: #606266;
  font-size: 15px;
  line-height: 1.8;
}

.hero-meta {
  display: grid;
  gap: 12px;
}

.meta-item {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff7f1, #ffffff);
  border: 1px solid rgba(234, 85, 4, 0.12);
}

.meta-label {
  color: #909399;
  font-size: 12px;
}

.meta-value {
  color: #303133;
  font-size: 16px;
  font-weight: 700;
}

.shortcut-card {
  padding: 28px 32px;
}

.shortcut-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.shortcut-search {
  flex: 1;
}

.group-filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.group-chip {
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 999px;
  background: #ffffff;
  padding: 9px 14px;
  color: #606266;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;

  &.is-active {
    border-color: transparent;
    background: linear-gradient(135deg, #ea5504, #f39a48);
    color: #ffffff;
  }
}

.recent-block {
  margin-bottom: 18px;
  padding: 16px 18px;
  border: 1px dashed rgba(234, 85, 4, 0.22);
  border-radius: 18px;
  background: linear-gradient(135deg, #fff8f3, #ffffff);
}

.recent-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  strong {
    color: #303133;
    font-size: 14px;
  }

  span {
    color: #909399;
    font-size: 12px;
  }
}

.recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.recent-chip {
  display: grid;
  gap: 3px;
  padding: 10px 14px;
  border: 0;
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 24px -22px rgba(23, 24, 24, 0.9);

  span {
    color: #303133;
    font-size: 13px;
    font-weight: 700;
  }

  small {
    color: #909399;
    font-size: 11px;
  }
}

.shortcut-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;

  h3 {
    margin: 0 0 6px;
    color: #303133;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.shortcut-count {
  color: #909399;
  font-size: 13px;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.shortcut-item {
  position: relative;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 18px;
  background: #ffffff;
  padding: 18px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(234, 85, 4, 0.24);
    box-shadow: 0 18px 36px -20px rgba(23, 24, 24, 0.3);
  }
}

.shortcut-flag {
  display: inline-flex;
  margin-top: 14px;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(15, 76, 92, 0.08);
  color: #0f4c5c;
  font-size: 11px;
  font-weight: 700;
}

.shortcut-group {
  display: inline-flex;
  margin-bottom: 10px;
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
}

.shortcut-title {
  display: block;
  margin-bottom: 8px;
  color: #303133;
  font-size: 18px;
}

.shortcut-desc {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}

.empty-state {
  display: grid;
  gap: 8px;
  padding: 26px 20px;
  border-radius: 18px;
  background: #fafbfc;
  text-align: center;

  strong {
    color: #303133;
    font-size: 16px;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}

@media (max-width: 1024px) {
  .hero-card {
    grid-template-columns: 1fr;
  }

  .shortcut-toolbar,
  .recent-head {
    flex-direction: column;
    align-items: stretch;
  }

  .shortcut-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hero-card,
  .shortcut-card {
    padding: 20px;
  }

  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>
