<template>
  <div class="app-body" :name="$route.name">
    <!-- 2026-05-25 UIUX #18 — Hero 背景改 JS-driven 可手動切換,加 pagination dots + 標題進場動畫 -->
    <div class="part-bg-top" aria-hidden="true">
      <div class="bg-img-list" :class="{ 'is-paused': !autoPlayBg }">
        <i
          v-for="(_, i) in heroBgCount"
          :key="i"
          class="bg-img bg-img-controlled"
          :class="[`ic-index-img-${i}`, { 'is-active': activeBgIndex === i }]"
        ></i>
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
            <h1 class="index-title main-title hero-fade-in">為生命給力，邁向長穩未來。</h1>
            <p class="index-title sub-title hero-fade-in hero-fade-in-delay-1">
              Empowering Lives, A Steady Tomorrow.
            </p>
          </div>
          <NuxtLink to="/ifare" class="btn btn-ifare-start transition-general hero-fade-in hero-fade-in-delay-2">
            <span class="txt-ifare">i-Fare</span>
            <span class="txt-end">，你的福利好幫手</span>
            <i class="icon ic-arrow-simple-white"></i>
          </NuxtLink>
          <!-- 2026-05-25 UIUX #18 — Hero 背景 pagination dots,可手動切換 -->
          <ul class="hero-dots" role="tablist" aria-label="背景輪播切換">
            <li v-for="i in heroBgCount" :key="i - 1">
              <button
                type="button"
                class="hero-dot"
                :class="{ active: activeBgIndex === i - 1 }"
                :aria-current="activeBgIndex === i - 1 ? 'true' : 'false'"
                :aria-label="`切換到背景 ${i} / ${heroBgCount}`"
                @click="onSelectBg(i - 1)"
              />
            </li>
          </ul>
        </div>
      </section>
      <!-- 2026-05-25 UIUX #20 — 滾動觸發進場動畫 -->
      <section class="section-news bg-section" v-scroll-reveal>
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
                  <h4 class="news-title">{{ _item.title }}</h4>
                  <span class="item-date">{{ formatDisplayDate(_item.releaseTime) }}</span>
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
      <!-- 2026-05-25 UIUX #81 — 首頁主 CTA 轉換路徑強化:讀完最新消息後再次引導 i-Fare -->
      <section class="section-cta bg-section" v-scroll-reveal>
        <div class="index-cta-card">
          <div class="index-cta-copy">
            <h2 class="index-cta-title">準備好找尋適合你的福利了嗎?</h2>
            <p class="index-cta-desc">i-Fare 整合全台公部門與民間補助資訊,輸入幾個條件就能找到符合你的方案。</p>
          </div>
          <NuxtLink to="/ifare" class="btn btn-index-cta transition-general">
            <span>立即使用 i-Fare 找福利</span>
            <i class="icon ic-arrow-simple-white" aria-hidden="true"></i>
          </NuxtLink>
        </div>
      </section>

      <section class="section-articles bg-section" v-scroll-reveal>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">福利專欄</h3>
            <span class="comp-shadow">ARTICLE</span>
          </div>
        </div>
        <div class="part-body">
          <div class="btn-tag-list">
            <!-- #15 這排分類本來只是 span @click，鍵盤完全點不到；比照 pages/ifare.vue 的做法補上按鈕語意 -->
            <span
              class="btn btn-tag transition-general"
              :class="{ active: _tag.isActive }"
              role="button"
              tabindex="0"
              :aria-pressed="_tag.isActive"
              v-for="_tag in codePolicyList"
              :key="_tag.id"
              @click="switchPolicy(_tag.id)"
              @keydown.enter.prevent="switchPolicy(_tag.id)"
              @keydown.space.prevent="switchPolicy(_tag.id)"
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
                  <h4 class="card-title">{{ _card.title }}</h4>
                  <span class="card-date">{{ formatDisplayDate(_card.releaseTime) }}</span>
                  <ul class="list-unstyled tags-list tags-list-clamp">
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
// 首頁 SEO / 社群分享卡（Open Graph）描述
// 以下 description 與 og 文案為預設值，符合本站定位，日後可再由團隊調整
// title 維持原本品牌名稱不變
useHead({
  title: '長穩社福慈善基金會',
  meta: [
    {
      name: 'description',
      content:
        '長穩社福慈善基金會 i-Fare 福利搜尋，讓您輸入自身年齡、身分與家庭狀況，快速找到適用的政府與民間福利補助資源，一站掌握專屬於您的社會福利。',
    },
    // Open Graph — 供 LINE / Facebook 等分享時顯示的標題與描述
    { property: 'og:title', content: '長穩社福慈善基金會｜i-Fare 福利搜尋' },
    {
      property: 'og:description',
      content:
        '長穩社福慈善基金會 i-Fare 福利搜尋，讓您輸入自身年齡、身分與家庭狀況，快速找到適用的政府與民間福利補助資源，一站掌握專屬於您的社會福利。',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: '長穩社福慈善基金會' },
  ],
})

// 首頁置頂福利專欄顯示數量
const TOP_WELFARE_DISPLAY_COUNT = 3;

const { $WebApiGet } = useNuxtApp();
const { getApiResultArray } = useApiResult();
const { formatDisplayDate } = useDateFormatter();

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

// 2026-05-25 UIUX #18 — Hero 背景輪播 JS 控制
// 取代原 CSS keyframe slider-animate,改成 ref 控制 active index,可手動 dot 切換
const heroBgCount = 5;
const HERO_AUTO_INTERVAL = 5000; // 5 秒換一張
const HERO_RESUME_DELAY = 12000; // 手動切換後 12 秒恢復自動
const activeBgIndex = ref(0);
const autoPlayBg = ref(true);
let heroAutoTimer: ReturnType<typeof setInterval> | null = null;
let heroResumeTimer: ReturnType<typeof setTimeout> | null = null;

function clearHeroAuto() {
  if (heroAutoTimer) {
    clearInterval(heroAutoTimer);
    heroAutoTimer = null;
  }
}

function clearHeroResume() {
  if (heroResumeTimer) {
    clearTimeout(heroResumeTimer);
    heroResumeTimer = null;
  }
}

function startHeroAuto() {
  clearHeroAuto();
  autoPlayBg.value = true;
  heroAutoTimer = setInterval(() => {
    activeBgIndex.value = (activeBgIndex.value + 1) % heroBgCount;
  }, HERO_AUTO_INTERVAL);
}

function onSelectBg(i: number) {
  activeBgIndex.value = i;
  clearHeroAuto();
  autoPlayBg.value = false;
  // 使用者操作後暫停一段時間,讓他看清楚選中的圖,再恢復自動
  clearHeroResume();
  heroResumeTimer = setTimeout(() => startHeroAuto(), HERO_RESUME_DELAY);
}

onMounted(() => {
  startHeroAuto();
});

onBeforeUnmount(() => {
  clearHeroAuto();
  clearHeroResume();
});

function LoadTopNews() {
  const topNews = $WebApiGet("/News/GetTopsNewsList");
  topNews.then((res: any) => {
    const _data = getApiResultArray<any>(res);

    let _newsList: Array<newsItem> = _data.map((item: any, i: number) => {
      return {
        id: item.id,
        title: item.title,
        releaseTime: item.releaseTime,
        content: item.content,
      };
    });

    newsList.splice(0);
    newsList.push(..._newsList);
  }).catch((e: any) => console.warn('[index] 熱門消息載入失敗', e)); // 2026-06-08 UIUX #186 — 補錯誤處理，避免靜默失敗/未處理 rejection
}

function SetWelfareData() {
  const topWelfare = $WebApiGet("/ArticlesWelfare/GetArticlesWelfareTops", {
    policyId: selectPolicy.value,
  });
  topWelfare.then((res: any) => {
    const _data = getApiResultArray<any>(res);

    let _list: Array<welfareItem> = _data
      .slice(0, TOP_WELFARE_DISPLAY_COUNT)
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
  }).catch((e: any) => console.warn('[index] 福利專欄載入失敗', e)); // 2026-06-08 UIUX #186
}

function LoadCodePolicy() {
  const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
  codePolicy.then((res: any) => {
    const _data = getApiResultArray<any>(res);

    let _list: Array<codeItem> = _data.map((item: any, i: number) => {
      return {
        codeName: item.codeName,
        id: item.id,
        isActive: i == 0,
      };
    });

    codePolicyList.splice(0);
    codePolicyList.push(..._list);
  }).catch((e: any) => console.warn('[index] 政策分類載入失敗', e)); // 2026-06-08 UIUX #186
}

// #19 這三份資料都只餵畫面、不影響 SEO（原本就是 fire-and-forget，SSR 根本不會等它們，
// 伺服器打完的結果直接丟掉，瀏覽器再打第二次）。改掛 onMounted 只在瀏覽器打一次。
onMounted(() => {
  LoadTopNews();
  SetWelfareData();
  LoadCodePolicy();
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
