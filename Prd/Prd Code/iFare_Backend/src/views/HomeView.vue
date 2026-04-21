<template>
  <!-- 主頁面：登入後的首頁，顯示今日日期與歡迎訊息 -->
  <main-header></main-header>
  <div class="section-main-card card-fullsize">
    <div class="card-info">
      <!-- 顯示今日日期（由 CommonLib 工具函式取得） -->
      <h5 class="title-today">今日：{{ dateNow }}</h5>
      <!-- 顯示目前登入使用者的姓名 -->
      <h4 class="title-welcome">歡迎 {{ userName }} 使用！</h4>
    </div>
  </div>

</template>

<style lang="scss" scoped>
.title-today,
.title-welcome {
  margin: 0;
  font-style: normal;
}
.title-today {
  line-height: 22px;
  font-weight: 400;
  letter-spacing: -0.01px;
}
.title-welcome {
  line-height: 24px;
  font-weight: 500;
}
</style>

<script setup lang="ts">
/**
 * HomeView.vue
 * 後台首頁
 * - 顯示今日日期與登入使用者姓名
 * - 每 3 分鐘檢查一次 Token 是否過期，過期則自動登出並導回登入頁
 */
import { ref, getCurrentInstance } from "vue";
import { ElScrollbar, ElMessage } from "element-plus";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

// 取得 Vue 全域屬性（CommonLib、router 等）
const app = getCurrentInstance()?.appContext.config.globalProperties
// 使用 Pinia userStore 取得使用者資訊
const userStore = useUserStore()

// 從 Store 取得目前登入的使用者姓名
const userName = ref(userStore.userName)

console.log(userStore.userName)
console.log(userStore.tokenExpiredTime)

// 取得今日日期字串，格式由 CommonLib.Date.GetDateNow() 決定
const dateNow = ref(app?.$CommonLib.Date.GetDateNow())

/**
 * Token 過期自動登出機制
 * 每 3 分鐘（1000ms * 60 * 3）檢查目前時間是否超過 tokenExpiredTime
 * 若過期則：
 *  1. 呼叫 userStore.logout() 清除使用者狀態
 *  2. 導回 Login 頁面
 *  3. 顯示錯誤提示訊息
 *  4. 清除 Interval 計時器
 */
const taskID = setInterval(() => {
  if (!userStore.tokenExpiredTime) {
    console.error('No token expiredTime!')
    return false
  }
  if (new Date() > new Date(userStore.tokenExpiredTime)) {
    useUserStore().logout()
    app?.$router.push({ name: 'Login'})
    ElMessage({
        message: "Token 已過期，您已被登出",
        type: 'error'
      })
    clearInterval(taskID)
  }
}, 1000 * 60 * 3)
</script>
