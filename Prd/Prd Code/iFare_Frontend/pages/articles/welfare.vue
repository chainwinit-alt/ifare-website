<template>
  <div class="app-body-child" :name="$route.name">
    <div class="article-state" v-if="isLoading">
      <div class="loading-hint">
        <span class="loading-spinner"></span>
        <span>福利專欄載入中...</span>
      </div>
    </div>

    <div class="part-empty part-error" v-else-if="hasError">
      <p>{{ errorMessage }}</p>
      <button class="btn-retry transition-general" @click="reloadWelfareDetail">重新載入</button>
    </div>

    <template v-else-if="welfareItem.id">
      <!-- 2026-05-25 UIUX #33 — 閱讀進度條 -->
      <ReadingProgressBar />
      <section class="section section-top">
        <div class="article-btn-tags" v-if="welfareItem.codePolicy">
          <span class="btn btn-tag active">{{ welfareItem.codePolicy }}</span>
        </div>
        <h2 class="article-title">{{ welfareItem.title }}</h2>
        <h6 class="article-date">
          {{ formatDisplayDate(welfareItem.releaseTime) }}
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
          <button class="btn-icon btn-ic-share" @click="ShareWebUrlToLine"><i class="ic-share"></i></button>
          <div ref="welfareContentRef" class="raw-html"></div>
        </div>
        <!-- 2026-05-25 UIUX #21 — LINE 訂閱主動推廣 -->
        <LineSubscribeCallout />
      </section>

      <section class="section section-bottom" v-if="welfareRelation.length">
        <div class="relation-links">
          <h5 class="relation-title">相關文章</h5>
          <ul class="list-unstyled relation-list">
            <li class="relation-item transition-general" v-for="item in welfareRelation" :key="item.id">
              <NuxtLink class="item-page-link" :to="{ path: '/articles/welfare', query: { id: item.id } }">
                <div class="part-top">
                  <span class="btn btn-tag active" v-if="item.codePolicy">{{ item.codePolicy }}</span>
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
    </template>

    <div class="part-empty" v-else>
      <p>目前沒有這篇福利專欄</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "福利專欄",
  toLinkName: "福利專欄",
  toLink: "/articles"
});

const { $WebApiGetDetailed } = useNuxtApp();
const { getApiResultValue, getApiResultItem } = useApiResult();
const { formatDisplayDate } = useDateFormatter();
const { getApiErrorMessage } = useApiErrorMessage();
const route = useRoute();
const requestUrl = useRequestURL();

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
useContentSocialTitle(() => welfareItem.title);

const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref("載入福利專欄時發生錯誤");
const currentArticleId = computed(() => Number(route.query.id || 0));
const sanitizedWelfareContent = computed(() => useSanitize(welfareItem.content));
const welfareContentRef = ref<HTMLElement | null>(null);

async function renderWelfareContent() {
  await nextTick();
  if (welfareContentRef.value) {
    welfareContentRef.value.innerHTML = sanitizedWelfareContent.value;
  }
}

watch(sanitizedWelfareContent, renderWelfareContent, { flush: "post" });

function safeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeKeywords(list: unknown) {
  if (!Array.isArray(list)) return [];

  return list
    .map((item: any) => safeText(item?.codeName))
    .filter(Boolean);
}

function decodeWelfareContent(value: unknown) {
  const content = safeText(value);
  if (!content) return "";

  try {
    return decodeURIComponent(content).replaceAll(
      "https://drive.google.com/uc?export=download&",
      "https://drive.google.com/thumbnail?sz=w800&"
    );
  } catch (error) {
    console.warn("[articles/welfare][decode]", error);
    return content.replaceAll(
      "https://drive.google.com/uc?export=download&",
      "https://drive.google.com/thumbnail?sz=w800&"
    );
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
  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = "載入福利專欄時發生錯誤";
  resetWelfareItem();

  if (!articleId) {
    hasError.value = true;
    errorMessage.value = "找不到這篇福利專欄。";
    isLoading.value = false;
    return;
  }

  try {
    const { data: response, error } = await $WebApiGetDetailed("/ArticlesWelfare/GetArticlesWelfareDetail", {
      articleWelfareID: articleId,
    });
    if (requestToken !== detailRequestToken) {
      return;
    }

    if (error) {
      hasError.value = true;
      errorMessage.value = getApiErrorMessage(error, "載入福利專欄時發生錯誤");
      return;
    }

    const data = getApiResultItem<any>(response);
    if (!data) {
      throw new Error("目前沒有這篇福利專欄。");
    }

    welfareItem.id = Number(data.id || 0);
    welfareItem.title = safeText(data.title);
    welfareItem.content = decodeWelfareContent(data.detail);
    welfareItem.releaseTime = safeText(data.releaseTime);
    welfareItem.codePolicy = safeText(data.codePolicy_LabelName);
    welfareItem.codeKeywords = normalizeKeywords(data.codeKeywordList);
  } catch (error: any) {
    if (requestToken !== detailRequestToken) {
      return;
    }
    hasError.value = true;
    errorMessage.value = error?.message || getApiErrorMessage(error, "載入福利專欄時發生錯誤");
  } finally {
    if (requestToken === detailRequestToken) {
      isLoading.value = false;
      await renderWelfareContent();
    }
  }
}

let relationRequestToken = 0;
async function loadWelfareRelation(articleId: number) {
  const requestToken = ++relationRequestToken;
  welfareRelation.splice(0);

  if (!articleId) {
    return;
  }

  try {
    const { data: response, error } = await $WebApiGetDetailed("/ArticlesWelfare/GetArticlesWelfareRelation", {
      articleWelfareID: articleId,
    });
    if (error) {
      console.warn("[articles/welfare][relation]", error);
      return;
    }

    const data = getApiResultValue<any>(response);
    if (!Array.isArray(data) || requestToken !== relationRequestToken) {
      return;
    }

    welfareRelation.push(
      ...data.map((item: any) => ({
        id: Number(item.id || 0),
        title: safeText(item.title),
        releaseTime: safeText(item.releaseTime),
        content: safeText(item.detail),
        codePolicy: safeText(item.codePolicy_LabelName),
        codeKeywords: normalizeKeywords(item.codeKeywordList),
      }))
    );
  } catch (error) {
    console.warn("[articles/welfare][relation]", error);
  }
}

function reloadWelfareDetail() {
  loadWelfareDetail(currentArticleId.value);
  loadWelfareRelation(currentArticleId.value);
}

async function ShareWebUrlToLine() {
  const shareToLine = "https://social-plugins.line.me/lineit/share";
  const currentUrl = import.meta.client ? window.location.href : requestUrl.href;
  const urlShare = `${shareToLine}?url=${encodeURIComponent(currentUrl)}`;

  await navigateTo(urlShare, {
    external: true,
  });
}

watch(
  () => [Number(route.query.id || 0), String(route.query.reload ?? "")] as const,
  async ([articleId]) => {
    await loadWelfareDetail(articleId);
    await loadWelfareRelation(articleId);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.article-state {
  padding: 48px 24px;
  text-align: center;
}
</style>
