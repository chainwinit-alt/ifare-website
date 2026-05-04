<template>
  <div class="app-body-child" :name="$route.name">
    <section class="section section-top">
      <h2 class="article-title">{{ newsItem.title }}</h2>
      <p class="article-date">{{ newsItem.releaseTime }}</p>
      <div class="article-tags">
        <label class="article-num">{{ newsItem.id }}</label>
      </div>
    </section>
    <section v-if="embedUrl" class="section section-video">
      <div class="video-wrap">
        <iframe
          :src="embedUrl"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
    </section>
    <section class="section section-info">
      <div class="article-info">
        <button class="btn-icon btn-ic-share" @click="ShareWebUrlToLine"><i class="ic-share"></i></button>
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
const route = useRoute()
const _newsID = route.query.id

interface newsItem {
    id: number,
    title: string,
    releaseTime: string,
    content: string,
    videoUrl: string
}

const newsItem = reactive<newsItem>({
id: 0,
content: "",
title: '',
releaseTime: '',
videoUrl: ''
});

function toYouTubeEmbed(url: string): string {
    if (!url) return ''
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
    return m ? `https://www.youtube.com/embed/${m[1]}` : ''
}
const embedUrl = computed(() => toYouTubeEmbed(newsItem.videoUrl))

const listNews = $WebApiGet('/News/GetNewsDetail', { newsID: _newsID})
listNews.then((res:any) => {
    const _data = res.result.result

    let _newsList:Array<newsItem> = _data.map((item:any, i:number) => {
        return {
            id: item.id,
            title: item.title,
            releaseTime: item.releaseTime,
            content: decodeURIComponent(item.content).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&"),
            videoUrl: item.videoUrl || ''
        }
    })

    newsItem.id = _newsList[0].id
    newsItem.title = _newsList[0].title
    newsItem.releaseTime = _newsList[0].releaseTime
    newsItem.content = _newsList[0].content
    newsItem.videoUrl = _newsList[0].videoUrl
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

<style scoped lang="scss">
.section-video {
  margin: 24px 0;
}
.video-wrap {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.18);
  background: #000;

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
}
</style>
