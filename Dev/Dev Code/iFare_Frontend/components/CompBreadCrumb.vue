<template>
  <nav class="page-navs" aria-label="breadcrumb">
    <ul class="list-unstyled">
      <li
        v-for="(item, index) in breadcrumbItems"
        :key="`${item.path}-${index}`"
        :aria-current="item.isCurrent ? 'page' : undefined"
      >
        <NuxtLink v-if="!item.isCurrent" :to="item.path">{{ item.label }}</NuxtLink>
        <span v-else>{{ item.label }}</span>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  path: string;
  label: string;
  isCurrent: boolean;
}

const route = useRoute();

const breadcrumbItems = computed(() =>
  route.matched
    .map((page, index) => {
      const label = String(page.meta.toLinkName || page.meta.title || '').trim();
      if (!label) {
        return null;
      }

      return {
        path: String(page.meta.toLink || page.path || '/'),
        label,
        isCurrent: index === route.matched.length - 1,
      } satisfies BreadcrumbItem;
    })
    .filter((item): item is BreadcrumbItem => Boolean(item)),
);
</script>
