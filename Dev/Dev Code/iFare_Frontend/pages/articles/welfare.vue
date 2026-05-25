<template>
  <div class="app-body-child" :name="$route.name">
    <!-- 2026-05-25 UIUX #33 — 閱讀進度條 -->
    <ReadingProgressBar />
    <section class="section section-top">
      <div class="article-btn-tags">
        <span class="btn btn-tag active">{{ welfareItem.codePolicy }}</span>
      </div>
      <h2 class="article-title">{{ welfareItem.title }}</h2>
      <h6 class="article-date">
        {{ formatDisplayDate(welfareItem.releaseTime) }} ・ 約 {{ estimatedReadMinutes }} 分鐘閱讀
      </h6>
      <div class="article-tags">
        <ul class="list-unstyled tags-list">
          <li v-for="keyword in welfareItem.codeKeywords" :key="keyword">{{ keyword }}</li>
        </ul>
        <label class="article-num">{{ welfareItem.id }}</label>
      </div>
    </section>

    <section class="section section-info">
      <div class="article-info">
        <button class="btn-icon btn-ic-share" @click="shareCurrentUrlToLine"><i class="ic-share"></i></button>
        <div class="raw-html" v-html="useSanitize(welfareItem.content)"></div>
      </div>
    </section>

    <section class="section section-bottom">
      <div class="relation-links">
        <h5 class="relation-title">相關文章</h5>
        <ul class="list-unstyled relation-list">
          <li class="relation-item transition-general" v-for="item in welfareRelation" :key="item.id">
            <NuxtLink class="item-page-link" :to="{ path: '/articles/welfare', query: { id: item.id } }">
              <div class="part-top">
                <span class="btn btn-tag active">{{ item.codePolicy }}</span>
                <span class="link-date">{{ formatDisplayDate(item.releaseTime) }}</span>
              </div>
              <h6 class="link-title">
                {{ item.title }}
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
  title: "福利專欄",
  toLinkName: "福利專欄",
  toLink: "/articles"
});

const { $WebApiGet } = useNuxtApp();
const { getApiResultValue } = useApiResult();
const { shareCurrentUrlToLine } = useShareToLine();
const { formatDisplayDate } = useDateFormatter();
const { estimateReadingMinutes } = useReadingTime();
const route = useRoute();

interface welfareItem {
  id: number;
  title: string;
  releaseTime: string;
  content: string;
  codePolicy: string;
  codeKeywords: Array<string>;
}

const welfareItem = reactive<welfareItem>({
  content: "",
  title: "",
  releaseTime: "",
  codePolicy: "",
  codeKeywords: [],
  id: 0
});

const welfareRelation = reactive<Array<welfareItem>>([]);
const estimatedReadMinutes = computed(() => estimateReadingMinutes(welfareItem.content));

function decodeWelfareContent(value: string) {
  if (!value) return "";

  try {
    return decodeURIComponent(value).replaceAll(
      "https://drive.google.com/uc?export=download&",
      "https://drive.google.com/thumbnail?sz=w800&"
    );
  } catch (error) {
    console.warn("[articles/welfare][decode]", error);
    return value;
  }
}

function resetWelfareItem() {
  welfareItem.id = 0;
  welfareItem.title = "";
  welfareItem.releaseTime = "";
  welfareItem.content = "";
  welfareItem.codePolicy = "";
  welfareItem.codeKeywords = [];
}

let detailRequestToken = 0;
async function loadWelfareDetail(articleId: number) {
  const requestToken = ++detailRequestToken;
  resetWelfareItem();

  if (!articleId) {
    return;
  }

  const res: any = await $WebApiGet("/ArticlesWelfare/GetArticlesWelfareDetail", {
    articleWelfareID: articleId,
  });
  const data = getApiResultValue<any>(res);
  if (!data || requestToken !== detailRequestToken) {
    return;
  }

  welfareItem.id = data.id;
  welfareItem.title = data.title;
  welfareItem.content = decodeWelfareContent(data.detail);
  welfareItem.releaseTime = data.releaseTime;
  welfareItem.codePolicy = data.codePolicy_LabelName;
  welfareItem.codeKeywords = data.codeKeywordList.map((_code: any) => _code.codeName);
  // 2026-05-25 UIUX #34 — 打開詳情就標記為已讀
  if (import.meta.client && welfareItem.id) {
    useReadMarks('articles-welfare').markRead(welfareItem.id);
  }
}

let relationRequestToken = 0;
async function loadWelfareRelation(articleId: number) {
  const requestToken = ++relationRequestToken;
  welfareRelation.splice(0);

  if (!articleId) {
    return;
  }

  const res: any = await $WebApiGet("/ArticlesWelfare/GetArticlesWelfareRelation", {
    articleWelfareID: articleId,
  });
  const data = getApiResultValue<any>(res);
  if (!Array.isArray(data) || requestToken !== relationRequestToken) {
    return;
  }

  welfareRelation.push(
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
    await Promise.all([loadWelfareDetail(articleId), loadWelfareRelation(articleId)]);
  },
  { immediate: true }
);
</script>
