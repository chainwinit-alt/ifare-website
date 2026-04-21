<template>
    <div class="app-body-child" :name="$route.name">
    <section class="section section-top">
      <div class="article-btn-tags">
        <span class="btn btn-tag active">{{ _welfareItem.codePolicy }}</span>
      </div>
      <h2 class="article-title">{{ _welfareItem.title }}</h2>
      <h6 class="article-date">{{ _welfareItem.releaseTime }}</h6>
      <div class="article-tags">
        <ul class="list-unstyled tags-list">
          <li v-for="_keyword in _welfareItem.codeKeywords">{{ _keyword }}</li>
        </ul>
        <label class="article-num">{{ _welfareItem.id }}</label>
      </div>
    </section>
    <section class="section section-info">
      <div class="article-info">
        <button class="btn-icon btn-ic-share" @click="ShareWebUrlToLine"><i class="ic-share"></i></button>
        <div class="raw-html" v-html="_welfareItem.content"></div>
      </div>
    </section>
    <section class="section section-bottom">
      <div class="relation-links">
        <h5 class="relation-title">相關專欄</h5>
        <ul class="list-unstyled relation-list">
          <li class="relation-item transition-general" v-for="_item in _welfareRelation" :key="_item.id">
            <NuxtLink class="item-page-link" :to="{path: '/articles/welfare', query: {id: _item.id, reload: ''}}" :key="$route.fullPath">
              <div class="part-top">
                <span class="btn btn-tag active">{{ _item.codePolicy }}</span>
                <span class="link-date">{{ _item.releaseTime }}</span>
              </div>
              <h6 class="link-title">
                {{ _item.title }}
              </h6>
              <div class="relation-item-bottom">
                <ul class="list-unstyled tags-list">
                  <li v-for="_key in _item.codeKeywords">{{ _key }}</li>
                </ul>
                <i class="ic-arrow-right link-url transition-general"></i>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: '福利專欄',
  toLinkName: '福利專欄',
  toLink: '/articles'
})
const { $WebApiGet } = useNuxtApp()
const route = useRoute()
const _welfareID = route.query.id

interface welfareItem {
    id: number,
    title: string,
    releaseTime: string,
    content: string,
    codePolicy: string,
    codeKeywords: Array<string>
}

const _welfareItem = reactive<welfareItem>({
content: "",
title: '',
releaseTime: '',
codePolicy: '',
codeKeywords: [],
id: 0
});
const welfareGet = $WebApiGet('/ArticlesWelfare/GetArticlesWelfareDetail', { articleWelfareID: _welfareID})
welfareGet.then((res:any) => {
    const _data = res.result.result
    
    _welfareItem.id = _data.id
    _welfareItem.title = _data.title
    _welfareItem.content = decodeURIComponent(_data.detail).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&")
    _welfareItem.releaseTime = _data.releaseTime
    _welfareItem.codePolicy = _data.codePolicy_LabelName
    _welfareItem.codeKeywords = _data.codeKeywordList.map((_code:any, j:number) => { return _code.codeName})
})


const _welfareRelation = reactive<Array<welfareItem>>([]);
const topWelfareGet = $WebApiGet('/ArticlesWelfare/GetArticlesWelfareRelation', { articleWelfareID: _welfareID})
topWelfareGet.then((res:any) => {
    const _data = res.result.result
    
    let _newsList:Array<welfareItem> = _data.map((item:any, i:number) => {
        return {
            id: item.id,
            title: item.title,
            releaseTime: item.releaseTime,
            content: item.detail,
            codePolicy: item.codePolicy_LabelName,
            codeKeywords: item.codeKeywordList.map((_code:any, j:number) => { return _code.codeName})
        }
    })

    _welfareRelation.push(..._newsList)
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