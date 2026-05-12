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
              <p>常用模組集中在這裡，進站後不用再逐層找側欄。</p>
            </div>
            <span class="shortcut-count">{{ shortcutCards.length }} 個模組</span>
          </div>

          <div class="shortcut-grid">
            <button
              v-for="item in shortcutCards"
              :key="item.routeName"
              type="button"
              class="shortcut-item"
              @click="goTo(item.routeName)"
            >
              <span class="shortcut-group">{{ item.group }}</span>
              <strong class="shortcut-title">{{ item.title }}</strong>
              <p class="shortcut-desc">{{ item.description }}</p>
            </button>
          </div>
        </div>
      </section>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue";
import { ElScrollbar, ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

interface ShortcutItem {
  title: string;
  description: string;
  routeName: string;
  group: string;
}

const router = useRouter();
const userStore = useUserStore();

const shortcutCards: ShortcutItem[] = [
  {
    title: "最新消息",
    description: "管理前台公告與新聞內容。",
    routeName: "News_DataList",
    group: "內容管理",
  },
  {
    title: "文章專區",
    description: "維護福利文章與懶人包。",
    routeName: "Articles_Welfare_DataList",
    group: "內容管理",
  },
  {
    title: "i-Fare 政策",
    description: "更新福利政策、條件與發布狀態。",
    routeName: "IFare_Policy_DataList",
    group: "i-Fare",
  },
  {
    title: "常見問答",
    description: "整理 i-Fare FAQ 與客服知識。",
    routeName: "IFare_QA_DataList",
    group: "i-Fare",
  },
  {
    title: "頁面管理",
    description: "管理動態頁面與版型內容。",
    routeName: "PageManagement_DataList",
    group: "CMS",
  },
  {
    title: "數據分析",
    description: "查看訪客、瀏覽與趨勢資料。",
    routeName: "Analysis",
    group: "營運",
  },
];

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
  router.push({ name: routeName });
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

onBeforeUnmount(() => {
  window.clearInterval(tokenCheckTask);
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

@media (max-width: 1024px) {
  .hero-card {
    grid-template-columns: 1fr;
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
