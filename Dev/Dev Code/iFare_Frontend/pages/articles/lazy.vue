<template>
  <div class="app-body-child" :name="$route.name">
    <!-- 2026-05-25 UIUX #33 — 閱讀進度條 -->
    <ReadingProgressBar />
    <section class="section section-top">
      <h2 class="article-title">{{ lazyItem.title }}</h2>
      <h6 class="article-date">
        {{ formatDisplayDate(lazyItem.releaseTime) }} ・ 約 {{ estimatedReadMinutes }} 分鐘閱讀
      </h6>
      <div class="article-tags">
        <ul class="list-unstyled tags-list">
          <li v-for="keyword in lazyItem.codeKeywords" :key="keyword">{{ keyword }}</li>
        </ul>
        <label class="article-num">{{ lazyItem.id }}</label>
      </div>
    </section>

    <section class="section section-info">
      <div class="article-info">
        <button class="btn-icon btn-ic-share" @click="shareCurrentUrlToLine"><i class="ic-share"></i></button>
        <div class="raw-html" v-html="useSanitize(lazyItem.content)"></div>
      </div>
    </section>

    <section class="section section-bottom">
      <div class="relation-links">
        <h5 class="relation-title">相關懶人包</h5>
        <ul class="list-unstyled relation-list">
          <li class="relation-item transition-general" v-for="item in lazyRelation" :key="item.id">
            <NuxtLink class="item-page-link" :to="{ path: '/articles/lazy', query: { id: item.id } }">
              <h6 class="link-title">
                {{ item.title }}
                <span class="link-date">{{ formatDisplayDate(item.releaseTime) }}</span>
              </h6>
              <div class="relation-item-bottom">
                <ul class="list-unstyled tags-list">
                  <li v-for="keyword in item.codeKeywords" :key="`${item.id}-${keyword}`">{{ keyword }}</li>
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
  title: "懶人包",
  toLinkName: "福利專欄",
  toLink: "/articles"
});

const { $WebApiGet } = useNuxtApp();
const { getApiResultValue } = useApiResult();
const { shareCurrentUrlToLine } = useShareToLine();
const { formatDisplayDate } = useDateFormatter();
const { estimateReadingMinutes } = useReadingTime();
const route = useRoute();

interface lazyItem {
  id: number;
  title: string;
  releaseTime: string;
  content: string;
  codePolicy: string;
  codeKeywords: Array<string>;
}

const lazyItem = reactive<lazyItem>({
  content: "",
  title: "",
  releaseTime: "",
  codePolicy: "",
  codeKeywords: [],
  id: 0
});

const lazyRelation = reactive<Array<lazyItem>>([]);
const lazyImageCount = ref(0);
const estimatedReadMinutes = computed(() =>
  estimateReadingMinutes(lazyItem.content, lazyImageCount.value),
);

function resetLazyItem() {
  lazyItem.id = 0;
  lazyItem.title = "";
  lazyItem.releaseTime = "";
  lazyItem.content = "";
  lazyItem.codePolicy = "";
  lazyItem.codeKeywords = [];
  lazyImageCount.value = 0;
}

let detailRequestToken = 0;
async function loadLazyDetail(articleId: number) {
  const requestToken = ++detailRequestToken;
  resetLazyItem();

  if (!articleId) {
    return;
  }

  const res: any = await $WebApiGet("/ArticlesLazy/GetArticlesLazyDetail", {
    articlesLazyID: articleId,
  });
  const data = getApiResultValue<any>(res);
  if (!data || requestToken !== detailRequestToken) {
    return;
  }

  lazyItem.id = data.id;
  lazyItem.title = data.title;
  // 2026-05-25 UIUX #34 — 打開詳情就標記為已讀
  if (import.meta.client && lazyItem.id) {
    useReadMarks('articles-lazy').markRead(lazyItem.id);
  }
  lazyItem.content = data.imageList
    .map(
      (_img: any, index: number) =>
        `<img width='100%' src="${_img.imagePath}" alt="${data.title} - ${index + 1}" loading="lazy" />`
    )
    .join(" ");
  lazyItem.releaseTime = data.releaseTime;
  lazyImageCount.value = data.imageList.length;
  lazyItem.codePolicy = data.codePolicy_LabelName;
  lazyItem.codeKeywords = data.codeKeywordList.map((_code: any) => _code.codeName);
}

let relationRequestToken = 0;
async function loadLazyRelation(articleId: number) {
  const requestToken = ++relationRequestToken;
  lazyRelation.splice(0);

  if (!articleId) {
    return;
  }

  const res: any = await $WebApiGet("/ArticlesLazy/GetArticlesLazyRelation", {
    articlesLazyID: articleId,
  });
  const data = getApiResultValue<any>(res);
  if (!Array.isArray(data) || requestToken !== relationRequestToken) {
    return;
  }

  lazyRelation.push(
    ...data.map((item: any) => ({
      id: item.id,
      title: item.title,
      releaseTime: item.releaseTime,
      content: item.detail,
      codePolicy: item.codePolicy_LabelName,
      codeKeywords: item.codeKeywordList.map((_code: any) => _code.codeName),
    }))
  );
}

watch(
  () => [Number(route.query.id || 0), String(route.query.reload ?? "")] as const,
  async ([articleId]) => {
    await Promise.all([loadLazyDetail(articleId), loadLazyRelation(articleId)]);
  },
  { immediate: true }
);
</script>
