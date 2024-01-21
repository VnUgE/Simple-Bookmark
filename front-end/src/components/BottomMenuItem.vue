<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore, TabId } from '../store';
import { toRefs } from 'vue';
import { noop } from 'lodash-es';
import { get, set } from '@vueuse/core';

const props = defineProps<{
    tab: TabId;
    name: String,
    disabled?: Boolean
}>()

const store = useStore()
const { activeTab } = storeToRefs(store)
const { name, disabled, tab } = toRefs(props)

//const isActive = (tab: TabId, activeTab: TabId) => isEqual(activeTab, tab);
const setActiveTab = (tab: TabId) => get(disabled) ? noop() : set(activeTab, tab)

</script>

<template>
   <button type="button" class="bm group" @click="setActiveTab(tab)">
        <svg class="group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <slot name="icon" />
        </svg>
        <span class="group-hover:text-blue-600 dark:group-hover:text-blue-500">
            {{ name }}
        </span>
    </button>
</template>

<style scoped lang="scss">
button.bm {
    @apply inline-flex flex-col items-center justify-center px-5 border-gray-200 border-x hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600;

    svg {
        @apply w-5 h-5 mb-2 text-gray-500 dark:text-gray-400;
    }

    span {
        @apply text-sm text-gray-500 dark:text-gray-400;
    }
}
</style>