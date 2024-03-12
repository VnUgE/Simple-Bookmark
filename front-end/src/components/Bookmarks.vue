<script setup lang="ts">
import { MaybeRef, Ref, computed, defineAsyncComponent, ref, shallowRef, watch } from 'vue';
import { useQuery, useStore } from '../store';
import { get, set, formatTimeAgo, useToggle, useTimestamp, useFileDialog, asyncComputed, toReactive, useClipboard } from '@vueuse/core';
import { useVuelidate } from '@vuelidate/core';
import { required, maxLength, minLength, helpers } from '@vuelidate/validators';
import { apiCall, useConfirm, useGeneralToaster, useVuelidateWrapper, useWait } from '@vnuge/vnlib.browser';
import { clone, cloneDeep, join, defaultTo, every, filter, includes, isEmpty, isEqual, first, isString, chunk, map, forEach, isNil } from 'lodash-es';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { parseNetscapeBookmarkString } from './Boomarks/util.ts';
import type { BatchUploadResult, Bookmark, BookmarkError } from '../store/bookmarks';
import AddOrUpdateForm from './Boomarks/AddOrUpdateForm.vue';
const Dialog = defineAsyncComponent(() => import('./global/Dialog.vue'));

const store = useStore();
const { waiting } = useWait();
const { reveal } = useConfirm();
const toaster = useGeneralToaster();
const bookmarks = computed(() => store.bookmarks.list);
const tags = computed(() => store.bookmarks.allTags);
const now = useTimestamp({interval: 1000});
const selectedTags = computed(() => store.bookmarks.tags);
const localSearch = shallowRef<string>(store.bookmarks.query);
const nextPageAvailable = computed(() => isEqual(bookmarks.value?.length, get(store.bookmarks.pages.currentPageSize)));
const { copy } = useClipboard()

//Refresh on page load
store.bookmarks.refresh();

const safeNameRegex = /^[a-zA-Z0-9_\-\|\., ]*$/;
const safeUrlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
const safeTagRegex = /^[a-zA-Z0-9-_]*$/;

const addOrEditValidator = (buffer: Ref<Partial<Bookmark>>) => {

    const rules = computed(() => ({
        Name: {
            required: helpers.withMessage('Name cannot be empty', required),
            safeName: helpers.withMessage('Bookmark name contains illegal characters', (value: string) => safeNameRegex.test(value)),
            minLength: helpers.withMessage('Name must be at least 1 characters', minLength(1)),
            maxLength: helpers.withMessage('Name must have less than 200 characters', maxLength(200))
        },
        Url: {
            required: helpers.withMessage('Url cannot be empty', required),
            safeUrl: helpers.withMessage('Url contains illegal characters or is not a valid URL', (value: string) => safeUrlRegex.test(value)),
            minLength: helpers.withMessage('Url must be at least 1 characters', minLength(1)),
            maxLength: helpers.withMessage('Url must have less than 300 characters', maxLength(300))
        },
        Description: {
            maxLength: helpers.withMessage('Description must have less than 500 characters', maxLength(500))
        },
        Tags: {
            maxLength: helpers.withMessage('Tags must have less than 64 characters', (tags: string[]) => every(tags, tag => tag.length < 64)),
            safeTag: helpers.withMessage('Tags contains illegal characters', (tags: string[]) => every(tags, tag => safeTagRegex.test(tag)))
        }
    }));

    return useVuelidate(rules, buffer as Ref<Bookmark>);
}

const toggleTag = (tag: string) => {
    const selected = defaultTo(get(selectedTags), []);

    if(isTagSelected(tag, selected)){
        const without = filter(selected, t => t !== tag);
        store.bookmarks.tags = clone(without);
    }else{
        selected.push(tag);
        store.bookmarks.tags = clone(selected);
    }
}

const clear = () => {
    store.bookmarks.tags = [];
    store.bookmarks.query = '';
    set(localSearch, '');
}

const bmDelete = async (bookmark: Bookmark) => {
    const { isCanceled } = await reveal({
        title: 'Delete bookmark',
        text: `Are you sure you want to delete ${bookmark.Name} ?`,
    })

    if(isCanceled) return;

    apiCall(async ({ toaster }) => {

        await store.bookmarks.api.delete(bookmark);

        toaster.general.success({
            title: 'Bookmark deleted',
            text: 'Bookmark has been deleted successfully'
        });

        store.bookmarks.refresh();
    })
}

const isTagSelected = (tag: string, currentTags: MaybeRef<string[]>) => includes(get(currentTags), tag);
const execSearch = () => store.bookmarks.query = get(localSearch);
const clearTags = () => store.bookmarks.tags = [];
const percentToWith = (percent: number) => ({ width: `${percent}%` });
const printErroMessage = (error: BookmarkError) => {
   const errorMessages = map(error.errors, e=> e.message);
   return `${error.subject.Url} - ${errorMessages.join(', ')}`
}

const edit = (() => {

    const editBuffer = ref<Partial<Bookmark>>({});

    const v$ = addOrEditValidator(editBuffer);
    const { validate } = useVuelidateWrapper(v$ as any);

    const editBookmark = (bookmark: Bookmark) => {
        //always edit a clone
        const clone = cloneDeep(bookmark);
        set(editBuffer, clone);
    }

    const cancel = () => {
        set(editBuffer, {});
        v$.value.$reset();
    }

    const submit = async () => {
        if (!await validate()) return

        apiCall(async ({ toaster }) => {
            //set the existing bookmark metadata
            await store.bookmarks.api.set(get(editBuffer) as Bookmark);

            toaster.general.success({
                title: 'Bookmark updated',
                text: 'Bookmark has been updated successfully'
            });

            store.bookmarks.refresh();
            cancel();
        })
    }

    const isOpen = computed(() => !isEmpty(editBuffer.value.Id));

    return {
        v$,
        isOpen,
        editBookmark,
        cancel,
        submit
    }
})()

const add = (() => {

    /**
     * The following query arguments are used to import a 
     * bookmark from a url the import dialog can be opened
     * externally by passing the url and title as query arguments
     */
    const importUrl = useQuery('url');
    const title = useQuery('title');
    const editBuffer = ref<Partial<Bookmark>>({});

    const v$ = addOrEditValidator(editBuffer);
    const { validate } = useVuelidateWrapper(v$ as any);

    const [isOpen, toggleOpen] = useToggle(false)

    //Clear buffer when dialog is closed
    watch(isOpen, open => {
        if (!open) {
            set(editBuffer, {})
            v$.value.$reset()

            importUrl.value = null;
            title.value = null;
        }
    })

    //only run on initial load
    if(importUrl.value) {
        set(editBuffer, {
            Name: title.value!,
            Url: importUrl.value!
        }); 
        //Open dialog
        toggleOpen(true);
    }

    const cancel = () => toggleOpen(false);
    const open = () => toggleOpen(true);

    const submit = async () => {
        if (!await validate()) return

        apiCall(async ({ toaster }) => {
            //set the existing bookmark metadata
            await store.bookmarks.api.add(get(editBuffer) as Bookmark);

            toaster.general.success({
                title: 'Bookmark added',
                text: 'Bookmark has been added successfully'
            });

            store.bookmarks.refresh();
            cancel();
        })
    }

    return {
        v$,
        isOpen,
        open,
        cancel,
        submit
    }
})()

const upload = (() => {

    const { open, reset, files } = useFileDialog({ 'accept': '.html', multiple: false });

    const file = computed(() => first(files.value));
    const ignoreErrors = ref(false);
    const fixErrors = ref(false);
    const errors = ref<BookmarkError[]>([]);
    const progress = ref<string[]>([]);
    const progressPercent = ref(0);

    //Automatically parse the file when it is selected
    const foundBookmarks = asyncComputed(async () => {
        if(!file.value) return [];
        try{
            //read to the text into mempry
            const text = await file.value!.text()
            //parse the text into bookmarks
            return parseNetscapeBookmarkString(text);
        }
        catch{
            toaster.error({
                title: 'Error reading file',
                text: 'There was an error reading the bookmarks HTML file'
            });
            return [];
        }
    })

    const isOpen = computed(() => !isEmpty(foundBookmarks.value));

    const cancel = () =>{
        reset();
        set(errors, []);
        set(progress, []);
        set(progressPercent, 0);
    }

    const submit = async () => {
        await apiCall(async () => {

            //parse the text into bookmarks
            const bms = get(foundBookmarks);

            if(get(fixErrors)){

                //truncate name length
                forEach(bms, bm => {
                    if(bm.Name.length > 100){
                        bm.Name = bm.Name.substring(0, 199);
                    }

                    //Replace illegal characters from name strings
                    bm.Name = bm.Name.replace(/[^a-zA-Z0-9_\-\|\., ]/g, ' ');

                    if(!isNil(bm.Description)){
                        //truncate description
                        if (bm.Description.length > 500) {
                            bm.Description = bm.Description.substring(0, 499);
                        }

                        bm.Description = bm.Description.replace(/[^\x00-\x7F]/g, '');   //only allow utf-8 characters
                    }

                    //Try to remove illegal chars from tags
                    bm.Tags = map(bm.Tags, tag => tag.replace(/[^a-zA-Z0-9\-]/g, ''));
                })
            }

            forEach(bms, bm => {
                //Remove any empty tags
                bm.Tags = filter(bm.Tags, tag => tag?.length > 0);

                if(isEmpty(bm.Tags)){
                    (bm.Tags as any) = null;
                }
            })

            const chunks = chunk(bms, 20);

            for(let i = 0; i < chunks.length; i++){
                
                progress.value[i] = `Uploading batch ${i+1} of ${chunks.length}`;
               
                //Exec the upload
                const result = await store.bookmarks.api.addMany(chunks[i],!get(ignoreErrors));
                let isError = false

                //See if an error occured
                if(!isString(result) && 'invalid' in result){
                    const { message, invalid } = result as BatchUploadResult;

                    //add errors to the error list
                    errors.value.push(...invalid);
                    isError = true;
                    
                   if(message){
                        toaster.error({
                            title: `Batch ${i} upload failed due to an error`,
                            text: message
                        })
                   }
                }

                if(isError){
                    const is = errors.value.length === 1 ? 'error' : 'errors';
                    progress.value[i] = `Failed to upload batch ${i+1} of ${chunks.length} with ${ errors.value.length } ${ is }`
                }
                else{
                    progress.value[i] = `Uploaded batch ${i+1} of ${chunks.length}: ${result}`;
                }

                //update the progress bar
                progressPercent.value = Math.round((i+1) / chunks.length * 100);
            }
        })

          //refresh the bookmarks
        store.bookmarks.refresh();

        //Force set progress once complete regardless of errors
        progressPercent.value = 100;
        progress.value.push('Upload complete');
    }

    return toReactive({
        file,
        isOpen,
        open,
        cancel,
        submit,
        fixErrors,
        foundBookmarks,
        progressPercent,
        errors,
        progress,
        ignoreErrors
    })
})()

</script>
<template>
    <div class="w-full h-full px-2">
        <div class="flex flex-row items-center mx-auto w-fit">

            <div class="xl:min-w-[40rem]">
                
                <form @click.prevent="execSearch()" class="flex items-center">   
                    <label for="simple-search" class="sr-only">Search</label>
                    <div class="relative w-full">
                        <div class="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m13 19-6-5-6 5V2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17Z"/>
                            </svg>
                        </div>
                        <input type="text" id="simple-search" v-model="localSearch" class="search" placeholder="Search bookmarks">
                        <span @click.prevent="clear()" class="absolute inset-y-0 flex items-center cursor-pointer end-0 pe-3">
                            <svg class="w-3 h-3 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                        </span>
                    </div>
                    <button type="submit" class="search" :disabled="waiting">
                        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                        <span class="sr-only">Search</span>
                    </button>
                </form>
            </div>

            <div class="relative ml-3 md:ml-10">
                  <Menu>
                    <MenuButton class="flex items-center gap-3 btn blue">
                         <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                        </svg>
                        <span class="hidden lg:inline">New bookmark</span>
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
                                <MenuItem as="template" v-slot="{  }">
                                    <li>
                                        <button @click="add.open()" class="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            Manual
                                        </button>
                                    </li>
                                </MenuItem>
                                <MenuItem as="template" v-slot="{  }">
                                    <li>
                                        <button @click="upload.open()" class="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            Upload html
                                        </button>
                                    </li>
                                </MenuItem>
                            </ul>
                        </MenuItems>
                    </transition>
                </Menu>
            </div>
        </div>
        <div class="grid flex-auto grid-cols-4 gap-8 sm:mt-4 max-w-[60rem] mx-auto w-full">
                
            <div class="col-span-4 lg:col-span-3">

                <div role="status" class="mx-auto mt-2 w-fit" :class="{'opacity-0': !waiting }">
                    <svg aria-hidden="true" class="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span class="sr-only">Loading...</span>
                </div>

                <div class="mx-auto sm:mt-2">
                    <div class="grid h-full grid-cols-1 gap-1 leading-tight md:leading-normal">
                        
                        <div v-for="bm in bookmarks" :key="bm.Id" :id="join(['bm', bm.Id], '-')" class="w-full p-1">
                            <div class="">
                                <a class="bl-link" :href="bm.Url" target="_blank">
                                    {{ bm.Name }}
                                </a>
                            </div>
                            <div class="flex flex-row items-center">
                                <span v-for="tag in bm.Tags">
                                    <span class="mr-1 text-sm text-teal-500 cursor-pointer dark:text-teal-300" @click="toggleTag(tag)">
                                        #{{ tag }}
                                    </span>
                                </span>
                                <p class="ml-2 text-sm text-gray-500 truncate dark:text-gray-400 text-ellipsis">
                                    {{ bm.Description }}
                                </p>
                            </div>
                            <div class="">
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ formatTimeAgo(new Date(bm.Created), {}, now) }}
                                </span>
                                | 
                                <span class="inline-flex gap-1.5">
                                    <button class="text-xs text-gray-700 dark:text-gray-400" @click="copy(bm.Url)">
                                        Copy
                                    </button>
                                    <button class="text-xs text-gray-700 dark:text-gray-400" @click="edit.editBookmark(bm)">
                                        Edit
                                    </button>  
                                    <button class="text-xs text-gray-700 dark:text-gray-400" @click="bmDelete(bm)">
                                        Delete
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="pr-4 mt-5 mb-10 ml-auto w-fit">
                        <div class="flex flex-col items-center">
                            <div class="text-sm">
                                Page {{ store.bookmarks.pages.currentPage }}
                            </div>
                            <!-- Buttons -->
                            <div class="inline-flex mt-1 xs:mt-0">
                                <button 
                                    @click="store.bookmarks.pages.prev()"
                                class="flex items-center justify-center h-8 px-3 text-sm font-medium text-white bg-gray-800 rounded-s hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                                    Prev
                                </button>
                                <button
                                    :disabled="!nextPageAvailable"
                                    @click="store.bookmarks.pages.next()" 
                                    class="flex items-center justify-center h-8 px-3 text-sm font-medium text-white bg-gray-800 border-0 border-gray-700 border-s rounded-e hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="hidden lg:block">
                <div class="h-10">
                    <div class="ml-12">
                        <button :disabled="isEmpty(selectedTags)" @click="clearTags()" 
                        class="text-sm font-bold text-gray-600 duration-75 ease-linear disabled:opacity-0 hover:underline">
                            Clear Tags
                        </button>
                    </div>
                </div>
                <div class="mt-1">
                    <ul class="grid grid-cols-2">
                        <li v-for="tag in tags" :key="tag" class="text-sm">
                            <span
                                class="mr-1 text-teal-500 cursor-pointer dark:text-teal-300" @click="toggleTag(tag)"
                                :class="{ 'selected': isTagSelected(tag, selectedTags) }"
                            >
                                {{ tag }}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    
    <Dialog :open="get(edit.isOpen)" title="Edit Bookmark" @cancel="edit.cancel">
        <template #body>
            <AddOrUpdateForm :v$="edit.v$" @submit="edit.submit" />
        </template>
    </Dialog>

     <Dialog :open="get(add.isOpen)" title="New Bookmark" @cancel="add.cancel">
        <template #body>
            <AddOrUpdateForm :v$="add.v$" @submit="add.submit" />
        </template>
    </Dialog>

     <Dialog :open="upload.isOpen" title="Upload Bookmarks" @cancel="upload.cancel">
        <template #body>
           <div class="p-4 text-gray-700 dark:text-gray-200">
                <div v-if="upload.progress.length > 0" >
                    <h5>
                        Progress
                    </h5>
                    <div class="py-3">
                        <div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                            <div 
                                class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" 
                                :style="percentToWith(upload.progressPercent)"
                            
                            >{{upload.progressPercent}}%
                        </div>
                        </div>
                    </div>
                    <div class="p-2 bg-gray-100 dark:bg-transparent border dark:border-gray-400 rounded max-h-[14rem] overflow-y-auto">
                        <div v-for="p in upload.progress" class="text-sm">
                            {{ p }}
                        </div>
                    </div>
                     <h5 class="my-2">
                        Errors
                    </h5>
                    <div class="p-2 bg-gray-100 dark:bg-transparent border dark:border-gray-400 rounded max-h-[14rem] overflow-y-auto">
                        <div v-for="e in upload.errors" class="text-sm text-red-500 whitespace-nowrap">
                            {{ printErroMessage(e) }}
                        </div>
                    </div>
                </div>
                <div v-else>
                     <form class="" @submit.prevent="upload.submit()">
                        <div class="text-left">
                            <div class="">
                                Reading files
                                <span class="font-semibold text-white">
                                     {{ upload.file?.name }}
                                </span>
                            </div>
                            <div class="">
                                Found {{ upload.foundBookmarks.length }} bookmarks to add
                            </div>
                        </div>
                        <div class="flex flex-row items-center justify-between my-3 ">
                            <div class="flex flex-row gap-4">
                                <div class="flex items-center">
                                    <input id="ignore-errors" type="checkbox" v-model="upload.ignoreErrors" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                    <label for="ignore-errors" class="text-sm font-medium ms-2">Ignore Errors</label>
                                </div>
                                <div class="flex items-center">
                                    <input id="fix-errors" type="checkbox" v-model="upload.fixErrors" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                    <label for="fix-errors" class="text-sm font-medium ms-2">Fix Errors</label>
                                </div>
                            </div>
                            <div>
                              
                            </div>
                             <button type="submit" class="btn blue">
                                Upload
                            </button>
                        </div> 
                        <div class="">
                           
                        </div>
                    </form>
                </div>
           </div>
        </template>
    </Dialog>

</template>

<style scoped lang="scss">
    input.search{
        @apply ps-10 p-2.5 border block w-full text-sm rounded pe-10;
        @apply bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 ;
    }

    button.search{
        @apply p-2.5 ms-2 text-sm font-medium text-white bg-blue-700 rounded border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
    }

    .selected{
        @apply text-red-500 dark:text-red-400 font-bold;
    }
   
</style>