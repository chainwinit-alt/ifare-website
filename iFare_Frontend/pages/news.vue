<template>
    <div class="app-body" name="news">
        <div class="bg-sector-top"></div>
        <div class="page-navs">
            <ul class="list-unstyled">
                <li v-for="_page in $route.matched"><NuxtLink :to="`${_page.meta.toLink}`">{{ _page.meta.toLinkName }}</NuxtLink></li>
            </ul>
        </div>
        <div class="section-list bg-section-list" v-if="$route.name == 'news'">
            <section class="section section-news bg-section">
                <div class="bg-radial"></div>
                <div class="part-top">
                    <div class="title-component">
                        <i class="ic-title-pattern"></i>
                        <h3 class="comp-title">最新消息</h3>
                        <span class="comp-shadow">NEWS</span>
                    </div>
                </div>
                <div class="part-body">
                    <div class="part-articles">
                        <ul class="list-unstyled article-list" v-if="isLoading">
                            <li class="article-item article-item-skeleton" v-for="n in 4" :key="`skeleton-${n}`">
                                <div class="skeleton-line skeleton-line-title"></div>
                                <div class="skeleton-line skeleton-line-info"></div>
                            </li>
                        </ul>
                        <div class="part-empty part-error" v-else-if="hasError">
                            <p>載入最新消息時發生錯誤</p>
                            <button class="btn-retry transition-general" @click="LoadNews">重新載入</button>
                        </div>
                        <div class="part-empty" v-else-if="newsList.length === 0">
                            <p>目前沒有最新消息</p>
                        </div>
                        <ul class="list-unstyled article-list" v-else>
                            <li class="article-item transition-general" v-for="_news in newsList" :key="_news.title">
                                <NuxtLink class="item-page-link" :to="{path: '/news/info', query: {id: _news.id}}">
                                    <div class="item-title">
                                        <h2 class="article-title">{{ _news.title }}</h2>
                                        <span class="item-date">{{ _news.releaseTime }}</span>
                                    </div>
                                    <div class="item-body">
                                        <div class="item-info">
                                            {{ _news.content }}
                                        </div>
                                        <i class="ic-arrow-right link-url transition-general"></i>
                                    </div>
                                </NuxtLink>
                            </li>
                        </ul>
                    </div>
                    <div class="part-pages">
                        <CompPage :page-list="pageNums" @change-page="PageChange"/>
                        <!-- <ul class="list-unstyled pages-list">
                            <li :class="{ active: _page.isActive }" v-for="_page in pageNums" :key="_page.num" @click="PageSwitch(_page.num)">{{ _page.num }}</li>
                        </ul>
                        <div class="page-control">
                            <button class="btn-icon btn-page-prev" :class="{ disabled: currentPage_News == 1}" @click="PageControl('News', 'prev', currentPage_News)"><i class="ic-arrow-simple"></i></button>
                            <button class="btn-icon btn-page-next" :class="{ disabled: currentPage_News >= storageNewsList.length/PAGEITEMMAX}" @click="PageControl('News', 'next', currentPage_News)"><i class="ic-arrow-simple"></i></button>
                        </div> -->
                    </div>
                </div>
            </section>
        </div>
        <NuxtPage v-else />
    </div>
</template>

<script setup lang="ts">
useHead({
  title: '最新消息'
})
definePageMeta({
  title: '最新消息',
  toLinkName: '首頁',
  toLink: '/'
})
import CompPage from "../components/CompPage.vue"
const { $WebApiGet } = useNuxtApp()
const PAGEITEMMAX = 10

interface newsItem {
    id: number,
    title: string,
    releaseTime: string,
    content: string
}

interface pageNum {
    num: number,
    isActive: boolean,
    isHide: boolean
}

const newsList = reactive<Array<newsItem>>([]);
const storageNewsList = reactive<Array<newsItem>>([])
const pageNums = reactive<Array<pageNum>>([])
const isLoading = ref(true)
const hasError = ref(false)

function LoadNews() {
    isLoading.value = true
    hasError.value = false
    storageNewsList.splice(0)
    newsList.splice(0)
    pageNums.splice(0)

    $WebApiGet('/News/GetNewsList').then((res:any) => {
        if (!res || !res.result || !res.result.result) {
            hasError.value = true
            isLoading.value = false
            return
        }
        const _data = res.result.result
        let _newsList:Array<newsItem> = _data.map((item:any) => ({
            id: item.id,
            title: item.title,
            releaseTime: item.releaseTime,
            content: item.content
        }))

        storageNewsList.push(..._newsList)
        newsList.push(..._newsList.slice(0, _newsList.length > PAGEITEMMAX ? PAGEITEMMAX : _newsList.length))

        for(let n = 0; n <= newsList.length/PAGEITEMMAX; n++){
            pageNums.push({
                num: n+1,
                isActive: n == 0,
                isHide: false
            })
        }
        isLoading.value = false
    }).catch(() => {
        hasError.value = true
        isLoading.value = false
    })
}

LoadNews()

function PageChange(pageNum:number) {
    newsList.splice(0)

    const index_S = (pageNum-1)*PAGEITEMMAX
    const index_E = pageNum  <= storageNewsList.length/PAGEITEMMAX ? pageNum*PAGEITEMMAX : storageNewsList.length

    let nextItems = storageNewsList.slice(index_S, index_E)
    newsList.push(...nextItems)
}

function PageSwitch(pageNum:number){
    pageNums.forEach((_page, i) => {
        _page.isActive = _page.num == pageNum
    })

    newsList.splice(0)

    const index_S = (pageNum-1)*PAGEITEMMAX
    const index_E = pageNum  <= storageNewsList.length/PAGEITEMMAX ? pageNum*PAGEITEMMAX : storageNewsList.length

    let nextItems = storageNewsList.slice(index_S, index_E)
    newsList.push(...nextItems)
}


const currentPage_News = ref(1);

function PageControl(target: string, controlType: string, currentPage: number) {
    
  if (controlType == "next") {
    if (target == "News") {
      
      if (currentPage >= storageNewsList.length/PAGEITEMMAX) {
        return false;
      }

      currentPage_News.value += 1;
    }
  }

  if (controlType == "prev") {
    if (target == "News") {
      if (currentPage <= 1) {
        return false;
      }

      currentPage_News.value -= 1;
    }
  }

  if (target == "News") PageSwitch(currentPage_News.value);
  console.log(currentPage)
}
</script>