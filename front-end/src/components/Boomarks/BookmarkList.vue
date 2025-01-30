<script setup lang="ts">
import { type Bookmark } from '../../store/bookmarks';

import { computed, ref } from 'vue';
import { useStore } from '../../store';
import { formatTimeAgo, useTimestamp, useClipboard } from '@vueuse/core';
import { apiCall, useConfirm } from '@vnuge/vnlib.browser';
import { join, truncate } from 'lodash-es';

const emit = defineEmits(['toggleTag', 'edit']);

const store = useStore();
const bookmarks = computed(() => store.bookmarks.list);
const readable = ref(true);     //Future allow users to switch between clean and readable layout

//Refresh on page load
store.bookmarks.refresh();

const { copy } = useClipboard()
const { reveal } = useConfirm();
const now = useTimestamp({ interval: 1000 });

const bmDelete = async (bookmark: Bookmark) => {
    const { isCanceled } = await reveal({
        title: 'Delete bookmark',
        text: `Are you sure you want to delete ${bookmark.Name} ?`,
    })

    if (isCanceled) return;

    apiCall(async ({ toaster }) => {

        await store.bookmarks.api.delete(bookmark);

        toaster.general.success({
            title: 'Bookmark deleted',
            text: 'Bookmark has been deleted successfully'
        });

        store.bookmarks.refresh();
    })
}

const truncatText = (desc: string) => truncate(desc, { length: 100 });

</script>

<template>
    <div class="grid h-full grid-cols-1 gap-0">
        <div v-for="bm in bookmarks" :key="bm.Id" :id="join(['bm', bm.Id], '-')" class="w-full p-1">
            <div v-if="readable" class="leading-tight md:leading-normal">
                <div class="">
                    <a class="bl-link" :href="bm.Url" target="_blank">
                        {{ bm.Name }}
                    </a>
                </div>
                <div class="flex flex-row items-center">
                    <span v-for="tag in bm.Tags">
                        <span class="mr-1 text-sm text-teal-500 cursor-pointer dark:text-teal-300"
                            @click="emit('toggleTag', tag)">
                            #{{ tag }}
                        </span>
                    </span>
                    <p class="ml-2 text-sm text-gray-500 truncate dark:text-gray-400 text-ellipsis">
                        {{ bm.Description }}
                    </p>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatTimeAgo(new Date(bm.Created), {}, now) }}
                    </span>
                    |
                    <span class="flex flex-row gap-1.5">
                        <button data-tooltip-target="tooltip-copy" class="text-xs text-gray-700 dark:text-gray-400" @click="copy(bm.Url)">
                            Copy
                        </button>
                        <button class="text-xs text-gray-700 dark:text-gray-400" @click="emit('edit', bm)">
                            Edit
                        </button>
                        <button class="text-xs text-gray-700 dark:text-gray-400" @click="bmDelete(bm)">
                            Delete
                        </button>
                    </span>

                    <div id="tooltip-copy" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-xs opacity-0 tooltip dark:bg-gray-700">
                        Tooltip content
                        <div class="tooltip-arrow" data-popper-arrow></div>
                    </div>
                </div>
            </div>
            <div v-else class="leading-tight clean-layout">
                <div class="flex flex-row">
                    <div class="flex-1">
                        <a class="text-sm font-bold bl-link" :href="bm.Url" target="_blank">
                            {{ bm.Name }}
                        </a>
                    </div>
                    <div class="">
                        <span class="inline-flex gap-1">
                            <button class="text-xs text-gray-700 dark:text-gray-400" @click="copy(bm.Url)">
                                <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                                    viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="2"
                                        d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
                                </svg>
                            </button>
                            <button class="text-xs text-gray-700 dark:text-gray-400" @click="emit('edit', bm)">
                                <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                                    viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                        stroke-width="2"
                                        d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                                </svg>
                            </button>
                            <button class="text-xs text-gray-700 dark:text-gray-400 " @click="bmDelete(bm)">
                                <svg class="w-5 h-5 text-gray-800 duration-100 ease-in dark:text-white trash"
                                    aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                                </svg>
                            </button>
                        </span>
                    </div>
                </div>
                <div class="flex flex-row items-start">
                    <p class="text-sm text-gray-500 dark:text-gray-300 max-w-[26rem] flex-auto">
                        {{ truncatText(bm.Description) }}
                    </p>
                    <div class="flex flex-col flex-wrap items-end ml-5 class gap-x-2 max-h-16">
                        <span v-for="tag in bm.Tags">
                            <span
                                class="mr-1 text-xs text-gray-500 duration-75 ease-linear cursor-pointer dark:text-gray-500 hover:text-teal-500 hover:dark:text-teal-400"
                                @click="emit('toggleTag', tag)">
                                {{ tag }}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .clean-layout {
        @apply shadow-sm md:px-6 p-3 border rounded-md h-[7rem];
        @apply bg-white dark:bg-gray-800 dark:border-gray-700 max-w-[40rem];

        button svg{
            &:hover{
                @apply text-gray-500 dark:text-gray-300 ease-linear duration-75;

                &.trash{
                    @apply hover:text-red-500;
                }
            }
        }
    }
</style>