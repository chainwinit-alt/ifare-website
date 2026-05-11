<template>
  <header class="app-header" :name="headerNameMode">
    <div class="row">
      <div class="part part-icon">
        <NuxtLink class="no-userselect" to="/" aria-label="iFare 基金會 — 回首頁">
          <i class="ic-logo app-icon" :name="elementColorMode" role="img" aria-hidden="true"></i>
          <h4 class="ic-logo-title app-icon-title" :name="elementColorMode" aria-hidden="true"></h4>
        </NuxtLink>
      </div>
      <nav class="part part-nav">
        <ul class="list-unstyled" :name="elementColorMode">
          <li :class="{ active: $route.name == 'about' }">
            <NuxtLink to="/about" :aria-current="$route.name === 'about' ? 'page' : undefined">關於長穩</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'news' }">
            <NuxtLink to="/news" :aria-current="$route.name === 'news' ? 'page' : undefined">最新消息</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'articles' }">
            <NuxtLink to="/articles" :aria-current="$route.name === 'articles' ? 'page' : undefined">福利專欄</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'collaborator' }">
            <NuxtLink to="/collaborator" :aria-current="$route.name === 'collaborator' ? 'page' : undefined">公益夥伴</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'future' }">
            <NuxtLink to="/future" :aria-current="$route.name === 'future' ? 'page' : undefined">未來規劃</NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/ifare"
              class="btn btn-empty-oval transition-general btn-ifare"
              :aria-current="$route.name?.toString().includes('ifare') ? 'page' : undefined"
              >i-Fare</NuxtLink
            >
          </li>
        </ul>
      </nav>
      <div class="part part-menu">
        <button
          ref="menuButtonRef"
          class="btn btn-icon btn-menu no-userselect"
          @click="MenuToggle"
          :aria-expanded="isShowMenu"
          aria-controls="mobile-menu"
          aria-label="開啟菜單"
          :name="elementColorMode"
        >
          <i class="ic-menu"></i>
        </button>
      </div>
    </div>
  </header>
  <div id="mobile-menu" class="mobile-menu" :class="{ active: isShowMenu }" role="dialog" aria-modal="true" aria-label="行動選單">
    <div class="menu-island" aria-hidden="true">
      <span class="menu-island__camera"></span>
      <span class="menu-island__label">{{ mobileMenuIslandLabel }}</span>
      <span class="menu-island__page">{{ mobileMenuPageLabel }}</span>
    </div>
    <ul class="list-unstyled menu-list">
      <li :class="{ active: $route.name == 'about'}">
        <NuxtLink class="mobileNav-link" to="/about" :aria-current="$route.name === 'about' ? 'page' : undefined" @click="MenuToggle"
          >關於長穩</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'news'}">
        <NuxtLink class="mobileNav-link" to="/news" :aria-current="$route.name === 'news' ? 'page' : undefined" @click="MenuToggle"
          >最新消息</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'articles'}">
        <NuxtLink class="mobileNav-link" to="/articles" :aria-current="$route.name === 'articles' ? 'page' : undefined" @click="MenuToggle"
          >福利專欄</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'ifare'}">
        <NuxtLink class="mobileNav-link" to="/ifare" :aria-current="$route.name?.toString().includes('ifare') ? 'page' : undefined" @click="MenuToggle"
          >i-Fare</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'collaborator'}">
        <NuxtLink class="mobileNav-link" to="/collaborator" :aria-current="$route.name === 'collaborator' ? 'page' : undefined" @click="MenuToggle"
          >公益夥伴</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'future'}">
        <NuxtLink class="mobileNav-link" to="/future" :aria-current="$route.name === 'future' ? 'page' : undefined" @click="MenuToggle"
          >未來規劃</NuxtLink
        >
      </li>
    </ul>
    <section class="section-menu-share">
      <div class="group-share">
        <NuxtLink class="btn btn-icon" to="/" aria-label="iFare 基金會 — 回首頁" @click="MenuToggle">
          <i class="ic-mobile-menu-logo" aria-hidden="true"></i>
        </NuxtLink>
        <a class="btn btn-icon" href="https://www.facebook.com/ccfIfare" target="_blank" rel="noopener noreferrer">
          <i class="ic-mobile-share-facebook"></i>
        </a>
        <a class="btn btn-icon" href="https://lin.ee/eHw9VpL" target="_blank" rel="noopener noreferrer">
          <i class="ic-mobile-share-line"></i>
        </a>
      </div>
    </section>
    <section class="section-right-top">
      <button class="btn btn-icon btn-close" @click="MenuToggle" aria-label="關閉菜單">
        <i class="ic-close"></i>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const isShowMenu = ref(false);
const menuButtonRef = ref<HTMLButtonElement | null>(null);
const mobileMenuIslandLabel = '\u9577\u7A69\u9078\u55AE';

const emits = defineEmits(["isOpened"]);

const mobileMenuPageLabel = computed(() => {
  const name = route.name?.toString() || '';

  if (name === 'about') return '\u95DC\u65BC\u9577\u7A69';
  if (name === 'news' || name.startsWith('news-')) return '\u6700\u65B0\u6D88\u606F';
  if (name === 'articles' || name.startsWith('articles-')) return '\u798F\u5229\u5C08\u6B04';
  if (name.includes('ifare')) return 'i-Fare';
  if (name === 'collaborator' || name.startsWith('collaborator-')) return '\u516C\u76CA\u5925\u4F34';
  if (name === 'future' || name.startsWith('future-')) return '\u672A\u4F86\u898F\u5283';
  return '\u5C0E\u89BD';
});

// #45: 抽出原本散在 5 處的 route 條件，集中管理
// header :name 用 (3 種值: 路由名 / 'indexIFare' / 'other')
const headerNameMode = computed(() => {
  const name = route.name?.toString() || ''
  const isIndex = name === 'index'
  const isIfare = name.includes('ifare')
  const isContact = name.includes('contact')
  if (!isIndex && !isIfare) return 'other'
  if (isIndex || isContact) return name
  return 'indexIFare'
})
// 子元素 (logo / nav ul / button) 用 (2 種值: 'other' / 'indexIFare')
const elementColorMode = computed(() => {
  const name = route.name?.toString() || ''
  const isIndex = name === 'index'
  const isIfare = name.includes('ifare')
  const isContact = name.includes('contact')
  if ((!isIndex && !isIfare) || isContact) return 'other'
  return 'indexIFare'
})

function MenuToggle() {
  isShowMenu.value = !isShowMenu.value;
  emits("isOpened", isShowMenu.value)
}

// Focus management: 開啟時 focus 至首個 menu link，關閉時 focus 回菜單按鈕
watch(isShowMenu, async (open) => {
  await nextTick();
  if (open) {
    const firstLink = document.querySelector<HTMLElement>('.mobile-menu.active .menu-list li:first-child a');
    firstLink?.focus();
  } else {
    menuButtonRef.value?.focus();
  }
});

// ESC 關閉 menu
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isShowMenu.value) {
    isShowMenu.value = false;
    emits("isOpened", false);
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));
</script>
