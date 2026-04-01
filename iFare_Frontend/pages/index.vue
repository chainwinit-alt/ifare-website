<template>
  <div class="app-body" :name="$route.name">
    <div class="part-bg-top">
      <div class="bg-img-list slider-animate">
        <i class="bg-img ic-index-img-0"></i>
        <i class="bg-img ic-index-img-1"></i>
        <i class="bg-img ic-index-img-2"></i>
        <i class="bg-img ic-index-img-3"></i>
        <i class="bg-img ic-index-img-4"></i>
      </div>
      <div class="bg-border-sector">
        <div class="bg-sector sector-fill"></div>
        <div class="bg-sector sector-lines"></div>
        <div class="bg-sector sector-img ic-index-border-img" v-if="false"></div>
      </div>
    </div>
    <div class="section-list bg-section-list bg-index">
      <section class="section-top">
        <div class="index-top-title">
          <div class="title-group">
            <h1 class="index-title main-title">為生命給力，邁向長穩未來。</h1>
            <h3 class="index-title sub-title">
              Empowering Lives, A Steady Tomorrow.
            </h3>
          </div>
          <NuxtLink to="/ifare" class="btn btn-ifare-start transition-general">
            <span class="txt-ifare">i-Fare</span>
            <span class="txt-end">，你的福利好幫手</span>
            <i class="icon ic-arrow-simple-white"></i>
          </NuxtLink>
        </div>
      </section>
      <section class="section-news bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">最新消息</h3>
            <span class="comp-shadow">NEWS</span>
          </div>
        </div>
        <div class="part-body">
          <ul class="list-unstyled news-list">
            <li class="news-item transition-general" v-for="_item in newsList">
              <NuxtLink class="item-page-link" :to="{ path: '/news/info', query: { id: _item.id } }">
                <div class="item-title">
                  <h2 class="news-title">{{ _item.title }}</h2>
                  <span class="item-date">{{ _item.releaseTime }}</span>
                </div>
                <div class="item-body">
                  <div class="item-info">
                    {{ _item.content }}
                  </div>
                  <i class="ic-arrow-right link-url transition-general"></i>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
        <div class="part-bottom">
          <NuxtLink to="/news" class="btn btn-more transition-general"
            >更多消息</NuxtLink
          >
        </div>
      </section>
      <section class="section-articles bg-section">
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">福利專欄</h3>
            <span class="comp-shadow">ARTICLE</span>
          </div>
        </div>
        <div class="part-body">
          <div class="btn-tag-list">
            <span
              class="btn btn-tag transition-general"
              :class="{ active: _tag.isActive }"
              v-for="_tag in codePolicyList"
              :key="_tag.id"
              @click="switchPolicy(_tag.id)"
              >{{ _tag.codeName }}</span
            >
          </div>
          <div class="card-article-list" :data-count="welfareList.length">
            <div class="card-article transition-general" v-for="_card in welfareList">
              <NuxtLink
                class="card-page-link"
                :to="{ path: '/articles/welfare', query: { id: _card.id } }"
              >
                <div class="card-top">
                  <h2 class="card-title">{{ _card.title }}</h2>
                  <span class="card-date">{{ _card.releaseTime }}</span>
                  <ul class="list-unstyled tags-list">
                    <li v-for="_keyword in _card.keywords">{{ _keyword }}</li>
                  </ul>
                </div>
                <div class="card-body">
                  <div class="card-info">
                    {{ _card.content }}
                  </div>
                </div>
                <div class="card-bottom">
                  <i class="ic-arrow-right-long link-url transition-general"></i>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
        <div class="part-bottom">
          <NuxtLink to="/articles" class="btn btn-more transition-general"
            >更多專欄</NuxtLink
          >
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '長穩社福慈善基金會'
})
const { $WebApiGet } = useNuxtApp();

interface newsItem {
  id: number;
  title: string;
  releaseTime: string;
  content: string;
}
interface welfareItem {
  id: number;
  title: string;
  releaseTime: string;
  content: string;
  keywords: Array<string>;
}
interface codeItem {
  codeName: string;
  id: number;
  isActive: boolean;
}

const newsList = reactive<Array<newsItem>>([]);
const welfareList = reactive<Array<welfareItem>>([]);
const codePolicyList = reactive<Array<codeItem>>([]);
const selectPolicy = ref(1);

const topNews = $WebApiGet("/News/GetTopsNewsList");
topNews.then((res: any) => {
  const _data = res.result.result;

  let _newsList: Array<newsItem> = _data.map((item: any, i: number) => {
    return {
      id: item.id,
      title: item.title,
      releaseTime: item.releaseTime,
      content: item.content,
    };
  });

  newsList.push(..._newsList);
});

function SetWelfareData() {
  const topWelfare = $WebApiGet("/ArticlesWelfare/GetArticlesWelfareTops", {
    policyId: selectPolicy.value,
  });
  topWelfare.then((res: any) => {
    const _data = res.result.result;

    let _list: Array<welfareItem> = _data
      .slice(0, 3)
      .map((item: any, i: number) => {
        return {
          id: item.id,
          title: item.title,
          releaseTime: item.releaseTime,
          content: item.detail,
          keywords: item.codeKeywordList.map((_code: any, j: number) => {
            return _code.codeName;
          }),
        };
      });
    welfareList.splice(0);
    welfareList.push(..._list);
  });
}

SetWelfareData();

const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
codePolicy.then((res: any) => {
  const _data = res.result.result;

  let _list: Array<codeItem> = _data.map((item: any, i: number) => {
    return {
      codeName: item.codeName,
      id: item.id,
      isActive: i == 0,
    };
  });

  codePolicyList.push(..._list);
});

function switchPolicy(id: number) {
  codePolicyList.forEach((_code: any, i: number) => {
    _code.isActive = _code.id == id;
  });
  selectPolicy.value = id;
  SetWelfareData();
}

// onMounted(() => {
//     if (sessionStorage.getItem('isShowAlert') != "true") {
//         alert("目前PC/手機系統尚在測試中，不便之處還請見諒！")
//     }

//     sessionStorage.setItem("isShowAlert", "true")
// })
</script>
