<script setup lang="ts">
import { apiCall, useWait } from '@vnuge/vnlib.browser';
import { useStore, type DownloadContentType, TabId } from '../../store';
import { ref } from 'vue';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

const { bookmarks } = useStore();

const downloadAnchor = ref();
const { waiting } = useWait()

const downloadBookmarks = (contentType: DownloadContentType) => {
    apiCall(async () => {
        const htmlData = await bookmarks.api.downloadAll(contentType);

        switch(contentType) {
            case 'text/html':
            case 'text/csv':
                {
                    const blob = new Blob([htmlData], { type: contentType });
                    const url = URL.createObjectURL(blob);
                    downloadAnchor.value.href = url
                }
                break;
            case 'application/json':
                {
                    const json = JSON.stringify(htmlData);
                    const blob = new Blob([json], { type: contentType });
                    downloadAnchor.value.href = URL.createObjectURL(blob);
                }
                break;
        }

        downloadAnchor.value.download = `bookmarks.${contentType.split('/')[1]}`
        downloadAnchor.value.click();
    });
}

const bookmarkHref = `
javascript: (function() {
  const bookmarkUrl = window.location; 
  let applicationUrl = '${window.location.origin}';
  applicationUrl += '?tab=${TabId.Bookmarks}&url=' + encodeURIComponent(bookmarkUrl); 
  applicationUrl += '&title='+document.title;
  window.open(applicationUrl);
})();`

</script>
<template>
    <div class="flex flex-col gap-4">
        <div class="flex-row hidden gap-2 sm:flex">
            <div class="">
                <a :href="bookmarkHref" @click.prevent="" class="text-sm cursor-move btn light">
                    <span class="whitespace-nowrap">
                        Add Bookmark 📎
                    </span>
                </a>
            </div>
            <p class="p-0.5 my-auto text-sm flex flex-row">
                <span class="">
                    <svg class="w-6 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
                    </svg>
                </span>
                <span>
                    Drag this button to your bookmarks bar to quickly add a new bookmark
                </span>
            </p>
        </div>
        <div class="relative ml-auto sm:ml-0 w-fit">
            <Menu>
                <MenuButton :disabled="waiting" class="flex items-center gap-3 btn light">
                    <div class="hidden lg:inline">Download</div>
                    <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4c0 .6.4 1 1 1h14c.6 0 1-.4 1-1v-4c0-.6-.4-1-1-1h-2m-1-5-4 5-4-5m9 8h0"/>
                    </svg>
                </MenuButton>
                    <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-out"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                >
                    <MenuItems class="absolute z-10 bg-white divide-y divide-gray-100 rounded-b shadow right-2 lg:left-0 min-w-32 lg:end-0 dark:bg-gray-700">
                        <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
                            <!-- Use the `active` state to conditionally style the active item. -->
                            <MenuItem as="template" v-slot="{ }">
                                <li>
                                    <button @click="downloadBookmarks('text/html')" class="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                        HTML
                                    </button>
                                </li>
                            </MenuItem>
                            <MenuItem as="template" v-slot="{ }">
                                <li>
                                    <button @click="downloadBookmarks('text/csv')" class="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                        CSV
                                    </button>
                                </li>
                            </MenuItem>
                              <MenuItem as="template" v-slot="{ }">
                                <li>
                                    <button @click="downloadBookmarks('application/json')" class="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                        JSON
                                    </button>
                                </li>
                            </MenuItem>
                        </ul>
                    </MenuItems>
                </transition>
            </Menu>
        </div>
    </div>
    
    <a ref="downloadAnchor" class="hidden"></a>
</template>