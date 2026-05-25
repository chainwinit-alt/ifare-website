<template>
  <div class="app-body-child" :name="$route.name">
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
        <button class="btn-icon btn-ic-share" @click="shareCurrentUrlToLine"><i class="ic-share"></i></button>
        <div class="raw-html" v-html="useSanitize(newsItem.content)"></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: '最新消息',
  toLinkName: '最新消息',
  toLink: '/news'
})
const { $WebApiGet } = useNuxtApp()
const { getApiResultArray } = useApiResult()
const { shareCurrentUrlToLine } = useShareToLine()
const { formatDisplayDate } = useDateFormatter()
const route = useRoute()
const _newsID = route.query.id

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

const listNews = $WebApiGet('/News/GetNewsDetail', { newsID: _newsID})
listNews.then((res:any) => {
    const _data = getApiResultArray<any>(res)
    if (_data.length === 0) return

    let _newsList:Array<newsItem> = _data.map((item:any, i:number) => {
        return {
            id: item.id,
            title: item.title,
            releaseTime: item.releaseTime,
            content: decodeURIComponent(item.content).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&")
        }
    })

    newsItem.id = _newsList[0].id
    newsItem.title = _newsList[0].title
    newsItem.releaseTime = _newsList[0].releaseTime
    newsItem.content = _newsList[0].content
    // 2026-05-25 UIUX #34 — 打開詳情就標記為已讀,列表頁再進時會顯示「已讀」
    if (import.meta.client && newsItem.id) {
      useReadMarks('news').markRead(newsItem.id);
    }
})

</script>

<style scoped lang="scss">
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
