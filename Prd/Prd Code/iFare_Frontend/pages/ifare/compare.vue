<template>
  <div class="app-body-child" :name="$route.name"></div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "ifare",
  toLinkName: "i-Fare",
  toLink: "/ifare",
});

await navigateTo("/ifare", { replace: true });
</script>
