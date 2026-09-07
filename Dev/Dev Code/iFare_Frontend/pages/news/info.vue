<template>
  <div class="app-body-child" :name="$route.name">
    <div class="article-state" v-if="isLoading">
      <div class="loading-hint">
        <span class="loading-spinner"></span>
        <span>最新消息載入中...</span>
      </div>
    </div>

    <div class="part-empty part-error" v-else-if="hasError">
      <p>{{ errorMessage }}</p>
      <button class="btn-retry transition-general" @click="loadNewsDetail(currentNewsId)">重新載入</button>
    </div>

    <template v-else-if="newsItem.id">
      <!-- 2026-05-25 UIUX #33 — 閱讀進度條,fixed 在頁面頂部 -->
      <ReadingProgressBar />
      <section class="section section-top">
        <h2 class="article-title">{{ newsItem.title }}</h2>
        <p class="article-date">{{ formatDisplayDate(newsItem.releaseTime) }}</p>
        <div class="article-tags">
          <label class="article-num">{{ newsItem.id }}</label>
        </div>
      </section>
      <section class="section section-info">
        <div class="article-info">
          <button class="btn-icon btn-ic-share" aria-label="分享到 LINE" @click="ShareWebUrlToLine"><i class="ic-share"></i></button>
          <div ref="newsContentRef" class="raw-html"></div>
        </div>
        <!-- 2026-05-25 UIUX #21 — 讀完文章主動推廣 LINE 訂閱 -->
        <LineSubscribeCallout />
      </section>
    </template>

    <div class="part-empty" v-else>
      <p>目前沒有這筆最新消息</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: '最新消息',
  toLinkName: '最新消息',
  toLink: '/news'
})
const { $WebApiGetDetailed } = useNuxtApp()
const { getApiResultItem } = useApiResult()
const { formatDisplayDate } = useDateFormatter()
const { getApiErrorMessage } = useApiErrorMessage()
const route = useRoute()
const requestUrl = useRequestURL()

interface newsItem {
    id: number,
    title: string,
    releaseTime: string,
    content: string
}

const newsItem = reactive<newsItem>({
id: 0,
content: "",
title: '',
releaseTime: ''
});

useContentSocialTitle(() => newsItem.title);

const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('載入最新消息時發生錯誤')
const currentNewsId = computed(() => Number(route.query.id || 0))
const sanitizedNewsContent = computed(() => useSanitize(newsItem.content))
const newsContentRef = ref<HTMLElement | null>(null)

async function renderNewsContent() {
    await nextTick()
    if (newsContentRef.value) {
        newsContentRef.value.innerHTML = sanitizedNewsContent.value
    }
}

watch(sanitizedNewsContent, renderNewsContent, { flush: 'post' })

function resetNewsItem() {
    newsItem.id = 0
    newsItem.title = ''
    newsItem.releaseTime = ''
    newsItem.content = ''
}

function safeText(value: unknown) {
    if (value === null || value === undefined) return ''
    return String(value)
}

function decodeNewsContent(value: unknown) {
    const content = safeText(value)

    try {
        return decodeURIComponent(content).replaceAll(
            "https://drive.google.com/uc?export=download&",
            "https://drive.google.com/thumbnail?sz=w800&"
        )
    } catch (error) {
        console.warn("[news/info][decode]", error)
        return content.replaceAll(
            "https://drive.google.com/uc?export=download&",
            "https://drive.google.com/thumbnail?sz=w800&"
        )
    }
}

let detailRequestToken = 0
async function loadNewsDetail(newsId: number) {
    const requestToken = ++detailRequestToken
    isLoading.value = true
    hasError.value = false
    errorMessage.value = '載入最新消息時發生錯誤'
    resetNewsItem()

    try {
        if (!newsId) {
            throw new Error('找不到這筆最新消息。')
        }

        const { data, error } = await $WebApiGetDetailed('/News/GetNewsDetail', { newsID: newsId})
        if (requestToken !== detailRequestToken) {
            return
        }

        if (error) {
            hasError.value = true
            errorMessage.value = getApiErrorMessage(error, '載入最新消息時發生錯誤')
            return
        }

        const item = getApiResultItem<any>(data)
        if (!item) {
            throw new Error('目前沒有這筆最新消息。')
        }

        newsItem.id = Number(item.id || 0)
        newsItem.title = safeText(item.title)
        newsItem.releaseTime = safeText(item.releaseTime)
        newsItem.content = decodeNewsContent(item.content)
    } catch (error: any) {
        if (requestToken !== detailRequestToken) {
            return
        }
        hasError.value = true
        errorMessage.value = error?.message || getApiErrorMessage(error, '載入最新消息時發生錯誤')
    } finally {
        if (requestToken === detailRequestToken) {
            isLoading.value = false
            await renderNewsContent()
        }
    }
}

watch(
    () => [currentNewsId.value, String(route.query.reload ?? "")] as const,
    ([newsId]) => {
        loadNewsDetail(newsId)
    },
    { immediate: true }
)

async function ShareWebUrlToLine() {
    const shareToLine = 'https://social-plugins.line.me/lineit/share'
    const currentUrl = import.meta.client ? window.location.href : requestUrl.href
    const urlShare = `${shareToLine}?url=${encodeURIComponent(currentUrl)}`

    await navigateTo(urlShare, {
        external: true
    })
}

</script>

<style scoped lang="scss">
.article-state {
  padding: 48px 24px;
  text-align: center;
}

// admin 在編輯器內貼的 YouTube iframe，前台保持 16:9 響應式 + 不爆寬
.raw-html {
  :deep(iframe) {
    display: block;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16 / 9;
    height: auto;
    margin: 24px 0;
    border-radius: 12px;
    box-shadow: 0 6px 18px -8px rgba(0, 0, 0, 0.18);
    background: #000;
  }
}
</style>
