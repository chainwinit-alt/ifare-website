<template>
  <div class="app-body-child" :name="$route.name">
    <section class="section section-top">
      <h2 class="article-title">{{ newsItem.title }}</h2>
      <h6 class="article-date">{{ newsItem.releaseTime }}</h6>
      <div class="article-tags">
        <label class="article-num">{{ newsItem.id }}</label>
      </div>
    </section>
    <section class="section section-info">
      <div class="article-info">
        <button class="btn-icon btn-ic-share" @click="ShareWebUrlToLine"><i class="ic-share"></i></button>
        <div class="raw-html" v-html="newsItem.content"></div>
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
    const _data = res.result.result
    
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
})

const _url = useRequestURL()
async function ShareWebUrlToLine() {
  const SHARETOLINE = 'https://social-plugins.line.me/lineit/share'
  const urlShare = `${SHARETOLINE}?url=${encodeURIComponent(_url.href)}`

  await navigateTo(urlShare, {
    external: true
  })
}

</script>
