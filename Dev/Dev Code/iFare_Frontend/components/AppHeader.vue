<template>
  <header class="app-header" :name="headerNameMode">
    <div class="row">
      <div class="part part-icon">
        <NuxtLink
          class="no-userselect"
          to="/"
          aria-label="iFare 首頁"
          data-island="iFare 首頁"
          data-island-style="link"
        >
          <i class="ic-logo app-icon" :name="elementColorMode" role="img" aria-hidden="true" />
          <h4 class="ic-logo-title app-icon-title" :name="elementColorMode" aria-hidden="true" />
        </NuxtLink>
      </div>

      <nav class="part part-nav">
        <ul class="list-unstyled" :name="elementColorMode">
          <li :class="{ active: $route.name === 'about' }">
            <NuxtLink to="/about" :aria-current="$route.name === 'about' ? 'page' : undefined" data-island="關於我們" data-island-style="link">
              關於我們
            </NuxtLink>
          </li>
          <li :class="{ active: $route.name === 'news' }">
            <NuxtLink to="/news" :aria-current="$route.name === 'news' ? 'page' : undefined" data-island="最新消息" data-island-style="link">
              最新消息
            </NuxtLink>
          </li>
          <li :class="{ active: $route.name === 'articles' }">
            <!-- 2026-05-25 nav 名稱跟頁內標題對齊:「福利專欄」 -->
            <NuxtLink to="/articles" :aria-current="$route.name === 'articles' ? 'page' : undefined" data-island="福利專欄" data-island-style="link">
              福利專欄
            </NuxtLink>
          </li>
          <li :class="{ active: $route.name === 'collaborator' }">
            <NuxtLink to="/collaborator" :aria-current="$route.name === 'collaborator' ? 'page' : undefined" data-island="公益夥伴" data-island-style="link">
              公益夥伴
            </NuxtLink>
          </li>
          <li :class="{ active: $route.name === 'future' }">
            <NuxtLink to="/future" :aria-current="$route.name === 'future' ? 'page' : undefined" data-island="未來規劃" data-island-style="link">
              未來規劃
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/ifare"
              class="btn btn-empty-oval transition-general btn-ifare"
              :aria-current="$route.name?.toString().includes('ifare') ? 'page' : undefined"
              data-island="i-Fare 福利查詢"
              data-island-style="button"
            >
              i-Fare
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="part part-menu">
        <button
          ref="menuButtonRef"
          class="btn btn-icon btn-menu no-userselect"
          :name="elementColorMode"
          :aria-expanded="isShowMenu"
          aria-controls="mobile-menu"
          aria-label="開啟主選單"
          data-island="開啟主選單"
          data-island-style="button"
          @click="toggleMenu"
        >
          <i class="ic-menu" />
        </button>
      </div>
    </div>
  </header>

  <div
    id="mobile-menu"
    class="mobile-menu"
    :class="{ active: isShowMenu }"
    role="dialog"
    aria-modal="true"
    aria-label="行動版主選單"
  >
    <ul class="list-unstyled menu-list">
      <li :class="{ active: $route.name === 'about' }">
        <NuxtLink class="mobileNav-link" to="/about" :aria-current="$route.name === 'about' ? 'page' : undefined" data-island="關於我們" data-island-style="link" @click="toggleMenu">
          關於我們
        </NuxtLink>
      </li>
      <li :class="{ active: $route.name === 'news' }">
        <NuxtLink class="mobileNav-link" to="/news" :aria-current="$route.name === 'news' ? 'page' : undefined" data-island="最新消息" data-island-style="link" @click="toggleMenu">
          最新消息
        </NuxtLink>
      </li>
      <li :class="{ active: $route.name === 'articles' }">
        <NuxtLink class="mobileNav-link" to="/articles" :aria-current="$route.name === 'articles' ? 'page' : undefined" data-island="福利專欄" data-island-style="link" @click="toggleMenu">
          福利專欄
        </NuxtLink>
      </li>
      <li :class="{ active: $route.name?.toString().includes('ifare') }">
        <NuxtLink class="mobileNav-link" to="/ifare" :aria-current="$route.name?.toString().includes('ifare') ? 'page' : undefined" data-island="i-Fare 福利查詢" data-island-style="button" @click="toggleMenu">
          i-Fare
        </NuxtLink>
      </li>
      <li :class="{ active: $route.name === 'collaborator' }">
        <NuxtLink class="mobileNav-link" to="/collaborator" :aria-current="$route.name === 'collaborator' ? 'page' : undefined" data-island="公益夥伴" data-island-style="link" @click="toggleMenu">
          公益夥伴
        </NuxtLink>
      </li>
      <li :class="{ active: $route.name === 'future' }">
        <NuxtLink class="mobileNav-link" to="/future" :aria-current="$route.name === 'future' ? 'page' : undefined" data-island="未來規劃" data-island-style="link" @click="toggleMenu">
          未來規劃
        </NuxtLink>
      </li>
    </ul>

    <section class="section-menu-share">
      <div class="group-share">
        <NuxtLink class="btn btn-icon" to="/" aria-label="iFare 首頁" data-island="iFare 首頁" data-island-style="link" @click="toggleMenu">
          <i class="ic-mobile-menu-logo" aria-hidden="true" />
        </NuxtLink>
        <a class="btn btn-icon" href="https://www.facebook.com/ccfIfare" target="_blank" rel="noopener noreferrer" data-island="Facebook 粉絲頁" data-island-style="link">
          <i class="ic-mobile-share-facebook" />
        </a>
        <a class="btn btn-icon" href="https://lin.ee/eHw9VpL" target="_blank" rel="noopener noreferrer" data-island="LINE 客服" data-island-style="button">
          <i class="ic-mobile-share-line" />
        </a>
      </div>
    </section>

    <section class="section-right-top">
      <button class="btn btn-icon btn-close" aria-label="關閉主選單" data-island="關閉主選單" data-island-style="button" @click="toggleMenu">
        <i class="ic-close" />
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const isShowMenu = ref(false);
const menuButtonRef = ref<HTMLButtonElement | null>(null);

const emit = defineEmits<{
  (e: 'isOpened', value: boolean): void;
}>();

const headerNameMode = computed(() => {
  const name = route.name?.toString() || '';
  const isIndex = name === 'index';
  const isIfare = name.includes('ifare');
  const isContact = name.includes('contact');

  if (!isIndex && !isIfare) return 'other';
  if (isIndex || isContact) return name;
  return 'indexIFare';
});

const elementColorMode = computed(() => {
  const name = route.name?.toString() || '';
  const isIndex = name === 'index';
  const isIfare = name.includes('ifare');
  const isContact = name.includes('contact');

  if ((!isIndex && !isIfare) || isContact) return 'other';
  return 'indexIFare';
});

function setMenuState(nextValue: boolean) {
  isShowMenu.value = nextValue;
  emit('isOpened', nextValue);
}

function toggleMenu() {
  setMenuState(!isShowMenu.value);
}

watch(isShowMenu, async (open) => {
  await nextTick();

  if (open) {
    const firstLink = document.querySelector<HTMLElement>('.mobile-menu.active .menu-list li:first-child a');
    firstLink?.focus();
    return;
  }

  menuButtonRef.value?.focus();
});

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isShowMenu.value) {
    setMenuState(false);
  }
}

watch(
  () => route.fullPath,
  () => {
    if (isShowMenu.value) {
      setMenuState(false);
    }
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
