<template>
  <div class="app-body" name="future">
    <CompBreadCrumb />
    <div class="section-list bg-section-list">
      <section class="section section-future bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">未來規劃</h3>
            <span class="comp-shadow">FUTURE</span>
          </div>
        </div>
        <div class="part-body">
          <div class="part-empty">
            <p>內容建置中，敬請期待</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '未來規劃'
})
definePageMeta({
  title: '未來規劃',
  toLinkName: '首頁',
  toLink: '/'
})
</script>
