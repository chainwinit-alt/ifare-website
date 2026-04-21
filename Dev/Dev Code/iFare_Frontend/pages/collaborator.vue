<template>
  <div class="app-body" name="collaborator">
    <div class="page-navs">
      <ul class="list-unstyled">
        <li v-for="_page in $route.matched"><NuxtLink :to="`${_page.meta.toLink}`">{{ _page.meta.toLinkName }}</NuxtLink></li>
      </ul>
    </div>
    <div class="section-list bg-section-list">
      <section class="section section-collaborator bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">公益夥伴</h3>
            <span class="comp-shadow">PARTNER</span>
          </div>
        </div>
        <div class="part-body">
          <div class="card-list">
            <div class="card-partner transition-general" v-for="_coll in collaboratorList">
              <div class="card-title">
                <img width="56" height="52" :src="_coll.imageFile" />
                <h4 class="partner-title">{{ _coll.title }}</h4>
              </div>
              <ul class="list-unstyled card-infos">
                <li name="tel">{{ _coll.tel }}</li>
                <li name="service">{{ _coll.serviceItem }}</li>
                <li name="website">
                  <a :href="_coll.url" target="_blank">{{ _coll.url }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '公益夥伴'
})
definePageMeta({
  title: '公益夥伴',
  toLinkName: '首頁',
  toLink: '/'
})
const { $WebApiGet } = useNuxtApp()
const PAGEITEMMAX = 10

interface collaboratorItem {
    id: number,
    title: string,
    serviceItem: string,
    tel: string,
    url: string,
    imageFile: string
}

interface pageNum {
    num: number,
    isActive: boolean
}

const collaboratorList = reactive<Array<collaboratorItem>>([]);

const listNews = $WebApiGet('/Collaborator/GetCollaboratorList')
listNews.then((res:any) => {
    const _data = res.result.result
    
    let _collaboratorList:Array<collaboratorItem> = _data.map((item:any, i:number) => {
        return {
            id: item.id,
            title: item.title,
            serviceItem: item.serviceItem,
            tel: item.tel,
            url: item.url,
            imageFile: item.imageFile
        }
    })
    collaboratorList.push(..._collaboratorList)
})
</script>
