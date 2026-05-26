<template>
  <main-header />
  <el-scrollbar class="main-scrollbar">
    <div class="home-layout">
      <!-- 歡迎卡：一句話歡迎 + 一句操作提示，避免一進來就看見資訊牆 -->
      <section class="section-main-card card-fullsize">
        <div class="card-info welcome-card">
          <div>
            <span class="welcome-kicker">i-Fare 後台</span>
            <h2 class="welcome-title">{{ displayUserName }}，今天想做什麼？</h2>
            <p class="welcome-desc">下方有最常用的 6 個動作，點下去就會帶到對應的頁面；其他模組都可以從左側選單找到。</p>
          </div>
          <span class="welcome-date">{{ dateNow }}</span>
        </div>
      </section>

      <!-- 任務型主入口：唯一互動主區，按權限過濾 -->
      <section class="section-main-card card-fullsize">
        <div class="card-info task-card">
          <div class="task-grid">
            <button
              v-for="(item, index) in visibleTasks"
              :key="item.key"
              type="button"
              class="task-item"
              @click="runTask(item)"
            >
              <span class="task-step">{{ index + 1 }}</span>
              <span class="task-icon" :class="`task-icon--${item.tone}`">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <strong class="task-title">{{ item.title }}</strong>
              <p class="task-desc">{{ item.description }}</p>
              <span class="task-cta">點這裡 →</span>
            </button>
          </div>

          <p class="task-footnote">
            找不到要做的事？打開左邊的選單，可以看到所有模組（代碼維護 / 帳戶 / 個人資料...）。
          </p>
        </div>
      </section>

      <!-- 管理現有內容：對應「我已經有資料、想看 / 改 / 刪」的需求 -->
      <section class="section-main-card card-fullsize">
        <div class="card-info manage-card">
          <div class="manage-head">
            <h3>管理現有內容</h3>
            <p>已經建立過的資料，從這裡進去檢視、編輯或下架。</p>
          </div>

          <div class="manage-grid">
            <button
              v-for="item in visibleManageItems"
              :key="item.routeName"
              type="button"
              class="manage-item"
              @click="goToRoute(item.routeName)"
            >
              <span class="manage-item__title">{{ item.title }}</span>
              <span class="manage-item__desc">{{ item.description }}</span>
              <span class="manage-item__arrow">→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, onMounted } from "vue";
import type { Component } from "vue";
import { ElIcon, ElScrollbar } from "element-plus";
import { useFeedback } from "@/composables/useFeedback";
import {
  Bell,
  Document,
  EditPen,
  Monitor,
  Picture,
  Setting,
  View,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";
import { FRONTEND_BASE_URL } from "@/config/adminEnv";

type TaskTone = "page" | "news" | "article" | "image" | "policy" | "preview" | "health";

interface TaskItem {
  key: string;
  title: string;
  description: string;
  icon: Component;
  tone: TaskTone;
  routeName?: string;
  externalUrl?: string;
  permissions?: string[];
}

interface ManageItem {
  title: string;
  description: string;
  routeName: string;
  permissions?: string[];
}

const router = useRouter();
const userStore = useUserStore();
const { error: showError } = useFeedback();

// 任務型入口：用「我要 XX」口吻、按權限過濾、依直覺操作順序排列
const taskItems: TaskItem[] = [
  {
    key: "task-add-news",
    title: "發布最新消息",
    description: "公告活動、社會福利新訊息，會出現在前台首頁。",
    icon: markRaw(Bell),
    tone: "news",
    routeName: "News_Add",
    permissions: ["管理者", "編輯者"],
  },
  {
    key: "task-add-article",
    title: "新增福利文章",
    description: "撰寫福利專欄文章，會顯示在前台「福利專欄」。",
    icon: markRaw(EditPen),
    tone: "article",
    routeName: "Articles_Welfare_Add",
    permissions: ["管理者", "編輯者"],
  },
  {
    key: "task-edit-policy",
    title: "編輯福利政策",
    description: "進政策列表挑一筆，修改內容、條件或洽辦資訊。",
    icon: markRaw(Setting),
    tone: "policy",
    routeName: "IFare_Policy_DataList",
  },
  {
    key: "task-upload-image",
    title: "上傳圖片",
    description: "管理共用圖庫；文章、夥伴、頁面都會用到這裡。",
    icon: markRaw(Picture),
    tone: "image",
    routeName: "ImgManager",
    permissions: ["管理者", "編輯者"],
  },
  {
    key: "task-add-page",
    title: "建立新頁面",
    description: "用 CMS 動態頁建立活動頁、專案頁等獨立頁面。",
    icon: markRaw(Document),
    tone: "page",
    routeName: "PageManagement_DataList",
    permissions: ["管理者", "編輯者"],
  },
  {
    key: "task-preview-frontend",
    title: "預覽前台",
    description: "在新分頁打開 i-Fare 前台網站，確認顯示效果。",
    icon: markRaw(View),
    tone: "preview",
    externalUrl: FRONTEND_BASE_URL || "https://www.i-fare.org.tw",
  },
  {
    key: "task-health-check",
    title: "看部署狀態",
    description: "確認 API、環境設定是否正常（管理者專用）。",
    icon: markRaw(Monitor),
    tone: "health",
    routeName: "Health",
    permissions: ["管理者"],
  },
];

const visibleTasks = computed(() =>
  taskItems.filter((task) => {
    if (!task.permissions || task.permissions.length === 0) return true;
    return task.permissions.includes(userStore.permission);
  }),
);

// 「管理現有內容」入口：對應已有的資料想檢視 / 編輯 / 刪除的場景
// 全部直連 *_DataList，從列表頁挑筆操作；權限照原 router 規則過濾
const manageItems: ManageItem[] = [
  {
    title: "最新消息",
    description: "查看所有公告、編輯或下架現有消息。",
    routeName: "News_DataList",
    permissions: ["管理者", "編輯者"],
  },
  {
    title: "福利文章",
    description: "管理福利專欄文章列表。",
    routeName: "Articles_Welfare_DataList",
  },
  {
    title: "懶人包",
    description: "管理圖文懶人包資料。",
    routeName: "Articles_Lazy_DataList",
  },
  {
    title: "福利政策",
    description: "查看政策列表、修改條件或洽辦資訊。",
    routeName: "IFare_Policy_DataList",
  },
  {
    title: "常見問答",
    description: "整理 i-Fare FAQ。",
    routeName: "IFare_QA_DataList",
    permissions: ["管理者", "編輯者"],
  },
  {
    title: "公益夥伴",
    description: "維護公益合作夥伴清單與 Logo。",
    routeName: "Collaborator_DataList",
    permissions: ["管理者", "編輯者"],
  },
];

const visibleManageItems = computed(() =>
  manageItems.filter((item) => {
    if (!item.permissions || item.permissions.length === 0) return true;
    return item.permissions.includes(userStore.permission);
  }),
);

function goToRoute(routeName: string) {
  router.push({ name: routeName });
}

const displayUserName = computed(() => userStore.userName || "管理者");
const dateNow = computed(() =>
  new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(new Date()),
);

function runTask(task: TaskItem) {
  if (task.externalUrl) {
    window.open(task.externalUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (task.routeName) {
    router.push({ name: task.routeName });
  }
}

// Token 過期檢查：每 3 分鐘檢查一次，超過時間自動登出（沿用原版邏輯）
const tokenCheckTask = window.setInterval(() => {
  if (!userStore.tokenExpiredTime) return;

  if (new Date() > new Date(userStore.tokenExpiredTime)) {
    userStore.logout();
    router.push({ name: "Login" });
    showError("登入憑證已過期，請重新登入。");
    window.clearInterval(tokenCheckTask);
  }
}, 1000 * 60 * 3);

onMounted(() => {
  // 簡化版不再需要記憶最近使用、不再需要 Ctrl+K 快捷鍵
});

onBeforeUnmount(() => {
  window.clearInterval(tokenCheckTask);
});
</script>

<style lang="scss" scoped>
.home-layout {
  display: grid;
  gap: 20px;
}

/* === 歡迎卡：極簡，只有一句話 === */
.welcome-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 32px 36px;
}

.welcome-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: #ea5504;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.welcome-title {
  margin: 0 0 10px;
  font-size: 28px;
  line-height: 1.25;
  color: #303133;
}

.welcome-desc {
  margin: 0;
  max-width: 720px;
  color: #606266;
  font-size: 15px;
  line-height: 1.8;
}

.welcome-date {
  align-self: end;
  padding: 8px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fff7f1, #ffffff);
  border: 1px solid rgba(234, 85, 4, 0.18);
  color: #ea5504;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

/* === 任務型主入口 === */
.task-card {
  padding: 28px 32px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.task-item {
  position: relative;
  display: grid;
  grid-template-columns: 56px 1fr;
  grid-template-rows: auto auto auto;
  column-gap: 14px;
  row-gap: 6px;
  padding: 22px 22px 18px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 20px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-4px);
    border-color: rgba(234, 85, 4, 0.32);
    box-shadow: 0 22px 40px -22px rgba(23, 24, 24, 0.32);
    outline: none;

    .task-cta {
      color: #ea5504;
      transform: translateX(2px);
    }
  }
}

/* 左上小步驟編號，讓新手有「依序操作」的感覺 */
.task-step {
  position: absolute;
  top: 14px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #f5f7fa;
  color: #909399;
  font-size: 11px;
  font-weight: 700;
}

.task-icon {
  grid-row: span 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  font-size: 26px;
  color: #ffffff;

  &.task-icon--page    { background: linear-gradient(135deg, #ea5504, #f39a48); }
  &.task-icon--news    { background: linear-gradient(135deg, #409eff, #66b1ff); }
  &.task-icon--article { background: linear-gradient(135deg, #67c23a, #95d475); }
  &.task-icon--image   { background: linear-gradient(135deg, #e6a23c, #f3c171); }
  &.task-icon--policy  { background: linear-gradient(135deg, #0f4c5c, #5897a8); }
  &.task-icon--preview { background: linear-gradient(135deg, #909399, #b1b3b8); }
  &.task-icon--health  { background: linear-gradient(135deg, #5a8dee, #7faaff); }
}

.task-title {
  grid-column: 2;
  align-self: end;
  color: #303133;
  font-size: 17px;
  line-height: 1.2;
}

.task-desc {
  grid-column: 2;
  align-self: start;
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}

.task-cta {
  grid-column: 2;
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  font-weight: 700;
  transition: color 0.2s ease, transform 0.2s ease;
}

.task-footnote {
  margin: 22px 0 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f7f8fa;
  border: 1px dashed rgba(48, 49, 51, 0.12);
  color: #909399;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

/* === 管理現有內容：輕量 chip-style list === */
.manage-card {
  padding: 24px 28px;
}

.manage-head {
  margin-bottom: 16px;

  h3 {
    margin: 0 0 4px;
    color: #303133;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}

.manage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.manage-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 12px;
  row-gap: 2px;
  padding: 14px 16px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(234, 85, 4, 0.32);
    box-shadow: 0 12px 24px -18px rgba(23, 24, 24, 0.32);
    transform: translateY(-2px);
    outline: none;

    .manage-item__arrow {
      color: #ea5504;
      transform: translateX(2px);
    }
  }
}

.manage-item__title {
  color: #303133;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.manage-item__desc {
  grid-column: 1 / -1;
  color: #606266;
  font-size: 12px;
  line-height: 1.6;
}

.manage-item__arrow {
  grid-row: 1;
  grid-column: 2;
  align-self: center;
  color: #c0c4cc;
  font-size: 16px;
  font-weight: 700;
  transition: color 0.2s ease, transform 0.2s ease;
}

@media (max-width: 1024px) {
  .welcome-card {
    grid-template-columns: 1fr;
    text-align: left;
  }

  .welcome-date {
    align-self: start;
    justify-self: start;
  }

  .task-grid,
  .manage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .welcome-card,
  .task-card,
  .manage-card {
    padding: 22px;
  }

  .task-grid,
  .manage-grid {
    grid-template-columns: 1fr;
  }

  .welcome-title {
    font-size: 22px;
  }
}
</style>
