<template>
  <header
    class="app-header"
    :name="
      ($route.name != 'index' && !$route.name?.toString().includes('ifare'))
        ? 'other'
        : $route.name == 'index' || $route.name?.toString().includes('contact')
        ? $route.name
        : 'indexIFare'
    "
  >
    <div class="row">
      <div class="part part-icon">
        <NuxtLink class="no-userselect" to="/">
          <i
            class="ic-logo app-icon"
            :name="
              ($route.name != 'index' &&
                !$route.name?.toString().includes('ifare')) ||
              $route.name?.toString().includes('contact')
                ? 'other'
                : 'indexIFare'
            "
          ></i>
          <h4
            class="ic-logo-title app-icon-title"
            :name="
              ($route.name != 'index' &&
                !$route.name?.toString().includes('ifare')) ||
              $route.name?.toString().includes('contact')
                ? 'other'
                : 'indexIFare'
            "
          ></h4>
        </NuxtLink>
      </div>
      <nav class="part part-nav">
        <ul
          class="list-unstyled"
          :name="
            ($route.name != 'index' &&
              !$route.name?.toString().includes('ifare')) ||
            $route.name?.toString().includes('contact')
              ? 'other'
              : 'indexIFare'
          "
        >
          <li :class="{ active: $route.name == 'about' }">
            <NuxtLink to="/about">關於長穩</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'news' }">
            <NuxtLink to="/news">最新消息</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'articles' }">
            <NuxtLink to="/articles">福利專欄</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'collaborator' }">
            <NuxtLink to="/collaborator">公益夥伴</NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/ifare"
              class="btn btn-empty-oval transition-general btn-ifare"
              >i-Fare</NuxtLink
            >
          </li>
        </ul>
      </nav>
      <div class="part part-menu">
        <button
          class="btn btn-icon btn-menu no-userselect"
          @click="MenuToggle"
          :name="
            ($route.name != 'index' &&
              !$route.name?.toString().includes('ifare')) ||
            $route.name?.toString().includes('contact')
              ? 'other'
              : 'indexIFare'
          "
        >
          <i class="ic-menu"></i>
        </button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" :class="{ active: isShowMenu }">
    <ul class="list-unstyled menu-list">
      <li :class="{ active: $route.name == 'about'}">
        <NuxtLink class="mobileNav-link" to="/about" @click="MenuToggle"
          >關於長穩</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'news'}">
        <NuxtLink class="mobileNav-link" to="/news" @click="MenuToggle"
          >最新消息</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'articles'}">
        <NuxtLink class="mobileNav-link" to="/articles" @click="MenuToggle"
          >福利專欄</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'ifare'}">
        <NuxtLink class="mobileNav-link" to="/ifare" @click="MenuToggle"
          >i-Fare</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'collaborator'}">
        <NuxtLink class="mobileNav-link" to="/collaborator" @click="MenuToggle"
          >公益夥伴</NuxtLink
        >
      </li>
    </ul>
    <section class="section-menu-share">
      <div class="group-share">
        <NuxtLink class="btn btn-icon" to="/" @click="MenuToggle">
          <i class="ic-mobile-menu-logo"></i>
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
      <button class="btn btn-icon btn-close" @click="MenuToggle">
        <i class="ic-close"></i>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
const isShowMenu = ref(false);

const emits = defineEmits(["isOpened"]);

function MenuToggle() {
  isShowMenu.value = !isShowMenu.value;
  emits("isOpened", isShowMenu.value)
}
</script>
