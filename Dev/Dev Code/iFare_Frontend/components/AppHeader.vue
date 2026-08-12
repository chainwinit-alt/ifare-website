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
          <!-- 2026-06-01 5 個系統父頁全部接 hover dropdown，data-driven 渲染 -->
          <li
            v-for="item in NAV_ITEMS"
            :key="item.parentKey"
            class="has-dropdown"
            :class="{
              active: $route.name === item.routeName,
              'dropdown-open': isDropdownOpen(item.parentKey) && hasChildren(item.parentKey),
            }"
            @mouseenter="openDropdown(item.parentKey)"
            @mouseleave="closeDropdown(item.parentKey)"
            @focusin="openDropdown(item.parentKey)"
            @focusout="onDropdownFocusOut($event, item.parentKey)"
          >
            <NuxtLink
              :to="item.to"
              :aria-current="$route.name === item.routeName ? 'page' : undefined"
              :aria-haspopup="hasChildren(item.parentKey) ? 'menu' : undefined"
              :aria-expanded="hasChildren(item.parentKey) ? isDropdownOpen(item.parentKey) : undefined"
              :aria-controls="`nav-${item.parentKey}-dropdown`"
              :data-island="item.label"
              data-island-style="link"
              @keydown.escape="closeDropdownImmediate(item.parentKey)"
            >
              {{ item.label }}
            </NuxtLink>
            <ul
              v-if="hasChildren(item.parentKey)"
              :id="`nav-${item.parentKey}-dropdown`"
              class="nav-dropdown"
              role="menu"
              :aria-label="`${item.label}延伸頁面`"
            >
              <li v-for="page in getChildren(item.parentKey)" :key="page.id" role="none">
                <NuxtLink
                  :to="`/${page.slug}`"
                  role="menuitem"
                  :data-island="`${item.label}子頁：${page.navTitle || page.title || page.slug}`"
                  data-island-style="link"
                  @click="closeDropdownImmediate(item.parentKey)"
                  @keydown.escape="closeDropdownImmediate(item.parentKey)"
                >
                  {{ page.navTitle || page.title || page.slug }}
                </NuxtLink>
              </li>
            </ul>
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
      <!-- 2026-06-01 mobile menu 也 data-driven：i-Fare 仍特殊處理插在 articles 後 -->
      <template v-for="(item, idx) in NAV_ITEMS" :key="`m-${item.parentKey}`">
        <li
          class="mobile-nav-item"
          :class="{
            active: $route.name === item.routeName,
            'has-submenu': hasChildren(item.parentKey),
            'submenu-open': isMobileOpen(item.parentKey) && hasChildren(item.parentKey),
          }"
        >
          <div class="mobile-nav-row">
            <NuxtLink
              class="mobileNav-link"
              :to="item.to"
              :aria-current="$route.name === item.routeName ? 'page' : undefined"
              :data-island="item.label"
              data-island-style="link"
              @click="toggleMenu"
            >
              {{ item.label }}
            </NuxtLink>
            <button
              v-if="hasChildren(item.parentKey)"
              type="button"
              class="mobile-submenu-toggle"
              :aria-expanded="isMobileOpen(item.parentKey)"
              :aria-controls="`mobile-${item.parentKey}-submenu`"
              :aria-label="`展開${item.label}延伸頁面`"
              @click="toggleMobileSubmenu(item.parentKey)"
            >
              <i class="mobile-submenu-chevron" aria-hidden="true" />
            </button>
          </div>
          <ul
            v-if="hasChildren(item.parentKey)"
            :id="`mobile-${item.parentKey}-submenu`"
            class="mobile-submenu"
          >
            <li v-for="page in getChildren(item.parentKey)" :key="page.id">
              <NuxtLink
                class="mobileNav-link mobileNav-sublink"
                :to="`/${page.slug}`"
                :data-island="`${item.label}子頁：${page.navTitle || page.title || page.slug}`"
                data-island-style="link"
                @click="toggleMenu"
              >
                {{ page.navTitle || page.title || page.slug }}
              </NuxtLink>
            </li>
          </ul>
        </li>
        <!-- i-Fare 插在 articles(idx=2) 後面 -->
        <li v-if="idx === 2" :class="{ active: $route.name?.toString().includes('ifare') }">
          <NuxtLink class="mobileNav-link" to="/ifare" :aria-current="$route.name?.toString().includes('ifare') ? 'page' : undefined" data-island="i-Fare 福利查詢" data-island-style="button" @click="toggleMenu">
            i-Fare
          </NuxtLink>
        </li>
      </template>
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
import { useDynamicPages } from '~/composables/useDynamicPages';

const route = useRoute();
const isShowMenu = ref(false);
const menuButtonRef = ref<HTMLButtonElement | null>(null);

const emit = defineEmits<{
  (e: 'isOpened', value: boolean): void;
}>();

// 2026-06-01 5 個系統父頁都接 hover dropdown（data-driven）
interface NavItem {
  to: string;
  label: string;
  routeName: string;
  parentKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/about', label: '關於長穩', routeName: 'about', parentKey: 'about' },
  { to: '/news', label: '最新消息', routeName: 'news', parentKey: 'news' },
  { to: '/articles', label: '福利專欄', routeName: 'articles', parentKey: 'articles' },
  { to: '/collaborator', label: '公益夥伴', routeName: 'collaborator', parentKey: 'collaborator' },
  // 未來規劃暫時註解，重新開放時再放回主選單。
  // { to: '/future', label: '未來規劃', routeName: 'future', parentKey: 'future' },
];

const { getAllPages, isPublishable } = useDynamicPages();
const { data: allPagesData } = await useAsyncData(
  'app-header-all-pages',
  () => getAllPages(),
  { default: () => [] },
);

function getChildren(parentKey: string) {
  return (allPagesData.value || [])
    .filter((page) => {
      if (!isPublishable(page)) return false;
      if (page.showOnParent === false) return false;
      return page.parentType === 'system' && page.parentKey === parentKey;
    })
    .sort((a, b) => {
      const order = (a.navOrder || 0) - (b.navOrder || 0);
      if (order !== 0) return order;
      return (b.updateDate || '').localeCompare(a.updateDate || '');
    });
}

function hasChildren(parentKey: string) {
  return getChildren(parentKey).length > 0;
}

const dropdownOpenMap = ref<Record<string, boolean>>({});
const mobileOpenMap = ref<Record<string, boolean>>({});
const closeTimers: Record<string, ReturnType<typeof setTimeout> | null> = {};

function isDropdownOpen(parentKey: string) {
  return !!dropdownOpenMap.value[parentKey];
}

function isMobileOpen(parentKey: string) {
  return !!mobileOpenMap.value[parentKey];
}

function clearCloseTimer(parentKey: string) {
  const t = closeTimers[parentKey];
  if (t) {
    clearTimeout(t);
    closeTimers[parentKey] = null;
  }
}

function openDropdown(parentKey: string) {
  if (!hasChildren(parentKey)) return;
  clearCloseTimer(parentKey);
  dropdownOpenMap.value[parentKey] = true;
}

function closeDropdown(parentKey: string) {
  clearCloseTimer(parentKey);
  closeTimers[parentKey] = setTimeout(() => {
    dropdownOpenMap.value[parentKey] = false;
  }, 120);
}

function closeDropdownImmediate(parentKey: string) {
  clearCloseTimer(parentKey);
  dropdownOpenMap.value[parentKey] = false;
}

function onDropdownFocusOut(event: FocusEvent, parentKey: string) {
  const next = event.relatedTarget as Node | null;
  const current = event.currentTarget as HTMLElement | null;
  if (current && next && current.contains(next)) return;
  closeDropdown(parentKey);
}

function toggleMobileSubmenu(parentKey: string) {
  mobileOpenMap.value[parentKey] = !mobileOpenMap.value[parentKey];
}

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
  if (!nextValue) {
    // 關 mobile menu 時把所有 accordion 收起
    Object.keys(mobileOpenMap.value).forEach((k) => {
      mobileOpenMap.value[k] = false;
    });
  }
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
