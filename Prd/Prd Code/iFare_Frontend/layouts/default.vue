
<template>
    <div class="app" :name="!$route.name?.toString().includes('ifare')?'other':'indexIFare'">
        <AppHeader @is-opened="isMenuOpen"/>
        <slot />
        <AppFooter />
    </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue';
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue';
const _isMenuOpen = ref(false)
useHead({
    bodyAttrs: {
        class: {
        "overflow-disabled": _isMenuOpen
        }
    }
})

function isMenuOpen(val:any) {
    _isMenuOpen.value = val
    // useHead({
    //     bodyAttrs: {
    //         class: {
    //         "overflow-disabled": val
    //         }
    //     }
    // })
}

</script>