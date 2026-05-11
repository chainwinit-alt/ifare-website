<template>
  <nav class="page-navs" aria-label="breadcrumb">
    <ul class="list-unstyled">
      <li
        v-for="(_page, index) in $route.matched"
        :key="_page.path"
        :aria-current="index === $route.matched.length - 1 ? 'page' : undefined"
      >
        <NuxtLink :to="`${_page.meta.toLink}`">{{ _page.meta.toLinkName }}</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
</script>
