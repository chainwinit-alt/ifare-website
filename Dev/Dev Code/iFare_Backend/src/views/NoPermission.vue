<template>
  <main-header />

  <div class="section-main-card card-fullsize permission-card">
    <div class="permission-empty">
      <div class="permission-icon" aria-hidden="true">
        <Lock />
      </div>
      <p class="permission-kicker">403</p>
      <h2>您沒有此頁面的存取權限</h2>
      <p class="permission-desc">
        目前帳號權限無法開啟這個功能。若需要使用，請聯絡管理者調整帳號權限。
      </p>
      <div class="permission-actions">
        <el-button size="large" @click="goBack">
          返回上一頁
        </el-button>
        <el-button type="primary" size="large" @click="goHome">
          回到首頁
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import { Lock } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import MainHeader from '@/components/MainHeader.vue';

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  goHome();
}

function goHome() {
  router.push({ name: 'Home' });
}
</script>

<style scoped lang="scss">
.permission-card {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
  padding: 48px 24px;
}

.permission-empty {
  width: min(520px, 100%);
  display: grid;
  justify-items: center;
  gap: 14px;
  text-align: center;
}

.permission-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(234, 85, 4, 0.1);
  color: #ea5504;
}

.permission-icon :deep(svg) {
  width: 30px;
  height: 30px;
}

.permission-kicker {
  margin: 4px 0 0;
  color: #ea5504;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.permission-empty h2 {
  margin: 0;
  color: #1f2d3d;
  font-size: 26px;
  line-height: 1.35;
}

.permission-desc {
  max-width: 420px;
  margin: 0;
  color: #606266;
  font-size: 15px;
  line-height: 1.8;
}

.permission-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

@media (max-width: 560px) {
  .permission-card {
    padding: 36px 18px;
  }

  .permission-empty h2 {
    font-size: 22px;
  }

  .permission-actions {
    width: 100%;
  }

  .permission-actions :deep(.el-button) {
    flex: 1 1 100%;
    margin-left: 0;
  }
}
</style>
