
<template>
    <!--
      預設版型（Default Layout）
      包含網站共用的頁首（AppHeader）和頁尾（AppFooter），
      中間 <slot /> 為各頁面內容的插入點。
      根元素依據路由名稱切換 name 屬性：
        - ifare 相關頁面使用 "indexIFare"（呈現深色/主題樣式）
        - 其他頁面使用 "other"
    -->
    <div class="app" :name="!$route.name?.toString().includes('ifare')?'other':'indexIFare'">
        <!-- 頁首元件：監聽 is-opened 事件以判斷行動選單是否開啟 -->
        <AppHeader @is-opened="isMenuOpen"/>
        <!-- 頁面主體內容由各路由頁面填入 -->
        <slot />
        <!-- 頁尾元件 -->
        <AppFooter />
        <!-- UIUX #136 — 聊天機器人浮動入口（全站固定） -->
        <CompChatbotEntry v-model:open="isChatbotOpen" />
        <!-- UIUX #137 — 聊天機器人 Welcome 視窗 -->
        <CompChatbotWelcome v-model:open="isChatbotOpen" />
    </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue';
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue';
import CompChatbotEntry from '../components/CompChatbotEntry.vue';
import CompChatbotWelcome from '../components/CompChatbotWelcome.vue';

// 追蹤行動選單開啟狀態，用於控制 body overflow
const _isMenuOpen = ref(false)

// UIUX #136 — 聊天機器人開啟狀態（之後 #137 Welcome 視窗 mount 時讀此 ref）
const isChatbotOpen = ref(false)

// 當選單開啟時，在 body 加上 overflow-disabled class，防止背景頁面捲動
useHead({
    bodyAttrs: {
        class: {
        "overflow-disabled": _isMenuOpen
        }
    }
})

/**
 * 接收 AppHeader 發出的 isOpened 事件
 * @param val 行動選單是否開啟（true/false）
 */
function isMenuOpen(val:any) {
    _isMenuOpen.value = val
}

</script>
