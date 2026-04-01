<template>
  <div class="app-body-child" :name="$route.name">
    <section class="section section-top">
      <h2 class="article-title">{{ _lazyItem.title }}</h2>
      <h6 class="article-date">{{ _lazyItem.releaseTime }}</h6>
      <div class="article-tags">
        <ul class="list-unstyled tags-list">
          <li v-for="_keyword in _lazyItem.codeKeywords">{{ _keyword }}</li>
        </ul>
        <label class="article-num">{{ _lazyItem.id }}</label>
      </div>
    </section>
    <section class="section section-info">
      <div class="article-info">
        <button class="btn-icon btn-ic-share" @click="ShareWebUrlToLine"><i class="ic-share"></i></button>
        <div class="raw-html" v-html="_lazyItem.content"></div>
      </div>
    </section>
    <section class="section section-bottom">
      <div class="relation-links">
        <h5 class="relation-title">相關懶人包</h5>
        <ul class="list-unstyled relation-list">
          <li class="relation-item transition-general" v-for="_lazy in _lazyRelation">
            <NuxtLink class="item-page-link" :to="{path: '/articles/lazy', query: {id: _lazy.id, reload: ''}}">
              <h6 class="link-title">
                {{ _lazy.title }}
                <span class="link-date">{{ _lazy.releaseTime }}</span>
              </h6>
              <div class="relation-item-bottom">
                <ul class="list-unstyled tags-list">
                  <li v-for="_key in _lazy.codeKeywords">{{ _key }}</li>
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
  title: '懶人包',
  toLinkName: '福利專欄',
  toLink: '/articles'
})
const { $WebApiGet } = useNuxtApp()
const route = useRoute()
const _lazyID = route.query.id

interface lazyItem {
    id: number,
    title: string,
    releaseTime: string,
    content: string,
    codePolicy: string,
    codeKeywords: Array<string>
}

const _lazyItem = reactive<lazyItem>({
content: "",
title: '',
releaseTime: '',
codePolicy: '',
codeKeywords: [],
id: 0
});
const lazyDetailGet = $WebApiGet('/ArticlesLazy/GetArticlesLazyDetail', { articlesLazyID: _lazyID})
lazyDetailGet.then((res:any) => {
    const _data = res.result.result
    const _releaseTime = _data.releaseTime.indexOf('T') >= 0 ? _data.releaseTime.split('T')[0].replaceAll('-', '.') : _data.releaseTime
    
    _lazyItem.id = _data.id
    _lazyItem.title = _data.title
    _lazyItem.content = _data.imageList.map((_img:any, j: number) => { return `<img width='100%' src="${_img.imagePath}" />`}).join(' ')
    _lazyItem.releaseTime = _releaseTime
    _lazyItem.codePolicy = _data.codePolicy_LabelName
    _lazyItem.codeKeywords = _data.codeKeywordList.map((_code:any, j:number) => { return _code.codeName})
})


const _lazyRelation = reactive<Array<lazyItem>>([]);
const lazyRelationGet = $WebApiGet('/ArticlesLazy/GetArticlesLazyRelation', { articlesLazyID: _lazyID})
lazyRelationGet.then((res:any) => {
    const _data = res.result.result
    
    let _list:Array<lazyItem> = _data.map((item:any, i:number) => {
        return {
            id: item.id,
            title: item.title,
            releaseTime: item.releaseTime,
            content: item.detail,
            codePolicy: item.codePolicy_LabelName,
            codeKeywords: item.codeKeywordList.map((_code:any, j:number) => { return _code.codeName})
        }
    })

    _lazyRelation.push(..._list)
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