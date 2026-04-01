<template>
    <div class="section-main-header">
        <div class="section-part part-left">
            <slot name="btnsLeft"></slot>
            <h3 class="title-page" v-show="!$route.meta.isTitleHide">{{ $route.meta.title }}</h3>
            <slot name="subtitle"></slot>
        </div>
        <div class="section-part part-right">
            <slot name="btnsRight"></slot>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.section-main-header {
    position: absolute;
    top: 0;
    width: 100%;
    min-height: $height-main-header;
}
</style>

<script setup lang="ts">
import {ref, reactive} from 'vue'
import { ElButton } from 'element-plus';


</script>