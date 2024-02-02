<script setup lang="ts">
import { apiCall, useWait } from '@vnuge/vnlib.browser';
import { useStore } from '../../store';
import { useObjectUrl, set } from '@vueuse/core';
import { ref } from 'vue';

const { bookmarks } = useStore();

const blobUrl = ref<Blob>();
const downloadAnchor = ref();
const obj = useObjectUrl(blobUrl);
const { waiting } = useWait()

const downloadBookmarks = () => {
    apiCall(async () => {
        const htmlData = await bookmarks.api.downloadAll();
        const blob = new Blob([htmlData], { type: 'text/html' });
        set(blobUrl, blob);
        downloadAnchor.value?.click();
    });
}

</script>
<template>
    <div class="flex flex-row justify-start">
        <div class="">
            <button class="flex items-center btn light" :disabled="waiting" @click="downloadBookmarks()">
                Download
            </button>
        </div>
    </div>
    <a ref="downloadAnchor" :href="obj" download="bookmarks.html" class="hidden"></a>
</template>