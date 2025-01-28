<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore, type TabName } from '../store';
import { toRefs } from 'vue';
import { noop } from 'lodash-es';
import { get, set } from '@vueuse/core';

const props = defineProps<{
    tab: TabName;
    name: String,
    disabled?: Boolean
}>()

const store = useStore()
const { activeTab } = storeToRefs(store)
const { name, disabled, tab } = toRefs(props)

//const isActive = (tab: TabId, activeTab: TabId) => isEqual(activeTab, tab);
const setActiveTab = (tab: TabName) => get(disabled) ? noop() : set(activeTab, tab)

</script>

<template>
    <li>
        <a href="/" @click.prevent="setActiveTab(tab)" class="lia group" :class="{ 'pointer-events-none disabled':disabled }">
            <svg class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
                <slot name="icon" />
            </svg>
            <span class="ms-3">{{ name }}</span>
        </a>
    </li>
</template>

<style lang="scss">
    .lia{
        @apply flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700;
        &.disabled{
            @apply opacity-50;
        }
    }
</style>