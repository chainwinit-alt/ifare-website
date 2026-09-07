<template>
  <div class="app-body-child" :name="$route.name">
    <div class="article-state" v-if="isLoading">
      <div class="loading-hint">
        <span class="loading-spinner"></span>
        <span>懶人包載入中...</span>
      </div>
    </div>

    <div class="part-empty part-error" v-else-if="hasError">
      <p>{{ errorMessage }}</p>
      <button class="btn-retry transition-general" @click="reloadLazyDetail">重新載入</button>
    </div>

    <template v-else-if="lazyItem.id">
      <!-- 2026-05-25 UIUX #33 — 閱讀進度條 -->
      <ReadingProgressBar />
      <section class="section section-top">
        <h2 class="article-title">{{ lazyItem.title }}</h2>
        <h6 class="article-date">
          {{ formatDisplayDate(lazyItem.releaseTime) }}
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
          <button class="btn-icon btn-ic-share" aria-label="分享到 LINE" @click="ShareWebUrlToLine"><i class="ic-share"></i></button>
          <div class="raw-html lazy-images">
            <img
              v-for="(imageSrc, index) in lazyImages"
              :key="`${lazyItem.id}-${index}`"
              width="100%"
              :src="imageSrc"
              :alt="`${lazyItem.title} - ${index + 1}`"
              loading="lazy"
            />
          </div>
        </div>
        <!-- 2026-05-25 UIUX #21 — LINE 訂閱主動推廣 -->
        <LineSubscribeCallout />
      </section>

      <section class="section section-bottom" v-if="lazyRelation.length">
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
    </template>

    <div class="part-empty" v-else>
      <p>目前沒有這篇懶人包</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "懶人包",
  toLinkName: "福利專欄",
  toLink: "/articles"
});

const { $WebApiGetDetailed } = useNuxtApp();
const { getApiResultValue, getApiResultItem } = useApiResult();
const { formatDisplayDate } = useDateFormatter();
const { getApiErrorMessage } = useApiErrorMessage();
const route = useRoute();
const requestUrl = useRequestURL();

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
const lazyImages = shallowRef<Array<string>>([]);
useContentSocialTitle(() => lazyItem.title);

const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref("載入懶人包時發生錯誤");
const currentArticleId = computed(() => Number(route.query.id || 0));

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

function normalizeImages(list: unknown) {
  return Array.isArray(list) ? list : [];
}

function normalizeImageSrc(value: unknown) {
  const src = safeText(value).trim();
  if (/^(https?:\/\/|data:image\/(?:png|jpe?g|gif|webp);base64,)/i.test(src)) {
    return src;
  }
  return "";
}

function resetLazyItem() {
  lazyItem.id = 0;
  lazyItem.title = "";
  lazyItem.releaseTime = "";
  lazyItem.content = "";
  lazyItem.codePolicy = "";
  lazyItem.codeKeywords = [];
  lazyImages.value = [];
}

let detailRequestToken = 0;
async function loadLazyDetail(articleId: number) {
  const requestToken = ++detailRequestToken;
  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = "載入懶人包時發生錯誤";
  resetLazyItem();

  if (!articleId) {
    hasError.value = true;
    errorMessage.value = "找不到這篇懶人包。";
    isLoading.value = false;
    return;
  }

  try {
    const { data: response, error } = await $WebApiGetDetailed("/ArticlesLazy/GetArticlesLazyDetail", {
      articlesLazyID: articleId,
    });
    if (requestToken !== detailRequestToken) {
      return;
    }

    if (error) {
      hasError.value = true;
      errorMessage.value = getApiErrorMessage(error, "載入懶人包時發生錯誤");
      return;
    }

    const data = getApiResultItem<any>(response);
    if (!data) {
      throw new Error("目前沒有這篇懶人包。");
    }

    const images = normalizeImages(data.imageList)
      .map((image: any) => normalizeImageSrc(image?.imagePath))
      .filter(Boolean);
    lazyItem.id = Number(data.id || 0);
    lazyItem.title = safeText(data.title);
    // 修正 #31:原本誤把內文指派成 data.title(複製貼上錯誤,上一行才剛指派過 title)。
    // 內文正確來源為 data.detail;比照本檔「相關懶人包」清單的 safeText(item.detail) 處理,
    // lazy 無 decode 函式、content 也未在 template 渲染,故沿用既有風格不需解碼。
    lazyItem.content = safeText(data.detail);
    lazyItem.releaseTime = safeText(data.releaseTime);
    lazyImages.value = images;
    lazyItem.codePolicy = safeText(data.codePolicy_LabelName);
    lazyItem.codeKeywords = normalizeKeywords(data.codeKeywordList);
  } catch (error: any) {
    if (requestToken !== detailRequestToken) {
      return;
    }
    hasError.value = true;
    errorMessage.value = error?.message || getApiErrorMessage(error, "載入懶人包時發生錯誤");
  } finally {
    if (requestToken === detailRequestToken) {
      isLoading.value = false;
    }
  }
}

let relationRequestToken = 0;
async function loadLazyRelation(articleId: number) {
  const requestToken = ++relationRequestToken;
  lazyRelation.splice(0);

  if (!articleId) {
    return;
  }

  try {
    const { data: response, error } = await $WebApiGetDetailed("/ArticlesLazy/GetArticlesLazyRelation", {
      articlesLazyID: articleId,
    });
    if (error) {
      console.warn("[articles/lazy][relation]", error);
      return;
    }

    const data = getApiResultValue<any>(response);
    if (!Array.isArray(data) || requestToken !== relationRequestToken) {
      return;
    }

    lazyRelation.push(
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
    console.warn("[articles/lazy][relation]", error);
  }
}

function reloadLazyDetail() {
  loadLazyDetail(currentArticleId.value);
  loadLazyRelation(currentArticleId.value);
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
    await loadLazyDetail(articleId);
    await loadLazyRelation(articleId);
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
