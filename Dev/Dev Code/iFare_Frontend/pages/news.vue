<template>
    <div class="app-body" name="news">
        <div class="bg-sector-top"></div>
        <CompBreadCrumb />
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
                            <p>{{ errorMessage }}</p>
                            <button class="btn-retry transition-general" @click="LoadNews">重新載入</button>
                        </div>
                        <div class="part-empty" v-else-if="newsList.length === 0">
                            <p>目前沒有最新消息</p>
                        </div>
                        <ul class="list-unstyled article-list" v-else>
                            <li class="article-item transition-general" v-for="_news in newsList" :key="_news.title">
                                <span class="badge-new" v-if="isNewItem(_news.releaseTime)">NEW</span>
                                <NuxtLink class="item-page-link" :to="{path: '/news/info', query: {id: _news.id}}">
                                    <div class="item-title">
                                        <h2 class="article-title">{{ _news.title }}</h2>
                                        <span class="item-date">{{ formatDisplayDate(_news.releaseTime) }}</span>
                                    </div>
                                    <div class="item-body">
                                        <div class="item-info">
                                            {{ _news.content }}
                                        </div>
                                        <i class="ic-arrow-right link-url transition-general" aria-label="閱讀全文"></i>
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
const { $WebApiGetDetailed } = useNuxtApp()
const { formatDisplayDate } = useDateFormatter()
const { getApiErrorMessage } = useApiErrorMessage()
const { getApiResultArray } = useApiResult()
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
const errorMessage = ref('載入最新消息時發生錯誤')

async function LoadNews() {
    isLoading.value = true
    hasError.value = false
    errorMessage.value = '載入最新消息時發生錯誤'
    storageNewsList.splice(0)
    newsList.splice(0)
    pageNums.splice(0)

    try {
        const { data, error } = await $WebApiGetDetailed('/News/GetNewsList')
        const list = getApiResultArray<any>(data)
        if (error || list.length === 0) {
            hasError.value = true
            errorMessage.value = getApiErrorMessage(error, '載入最新消息時發生錯誤')
            return
        }
        let _newsList:Array<newsItem> = list.map((item:any) => ({
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
    } catch (error) {
        hasError.value = true
        errorMessage.value = getApiErrorMessage(error, '載入最新消息時發生錯誤')
    } finally {
        isLoading.value = false
    }
}

LoadNews()

function isNewItem(releaseTime: string): boolean {
    const t = new Date(releaseTime).getTime()
    if (Number.isNaN(t)) return false
    return Date.now() - t < 7 * 24 * 60 * 60 * 1000
}

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
}
</script>
