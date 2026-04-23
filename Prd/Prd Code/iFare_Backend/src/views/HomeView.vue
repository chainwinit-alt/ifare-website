<template>
  <main-header></main-header>
  <div class="section-main-card card-fullsize">
    <div class="card-info">
      <h5 class="title-today">今日：{{ dateNow }}</h5>
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
import { ref, getCurrentInstance } from "vue";
import { ElScrollbar, ElMessage } from "element-plus";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance()?.appContext.config.globalProperties
const userStore = useUserStore()

const userName = ref(userStore.userName)

console.log(userStore.userName)

console.log(userStore.tokenExpiredTime)

const dateNow = ref(app?.$CommonLib.Date.GetDateNow())

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
