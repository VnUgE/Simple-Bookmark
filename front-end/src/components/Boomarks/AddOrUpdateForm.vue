<script setup lang="ts">
import { computed, shallowRef, toRefs } from 'vue';
import { set, watchDebounced } from '@vueuse/core'
import { isEmpty, join, noop, split } from 'lodash-es';
import { useStore } from '../../store';
import { WebMessage, useWait } from '@vnuge/vnlib.browser';
import { AxiosError } from 'axios';

const emit = defineEmits(['submit'])
const props = defineProps<{
    v$:any
}>()

const { v$ } = toRefs(props)

//Convert tags array to string
const tags = computed({
    get: () => join(v$.value.Tags.$model, ','),
    set: (value:string) => v$.value.Tags.$model = split(value, ',')
})

const { websiteLookup:lookup } = useStore()
const { setWaiting, waiting } = useWait()

const errMessage = shallowRef();

const execLookup = async () => {
    //url must be valid before searching
    if(v$.value.Url.$invalid) return

    setWaiting(true)

    try{
        const { title, description, keywords } = await lookup.execLookup(v$.value.Url.$model);

        //Set the title and description
        if(title){
            v$.value.Name.$model = title;
            v$.value.Name.$dirty = true;
        }

        if(description){
            v$.value.Description.$model = description;
            v$.value.Description.$dirty = true;
        }

        if(!isEmpty(keywords)){
            v$.value.Tags.$model = keywords;
            v$.value.Tags.$dirty = true;
        }
    }
    catch(e){       
        console.error(e)
        const res = (e as AxiosError).response?.data;
        set(errMessage, (res as WebMessage)?.result);
    }
    finally{
        setWaiting(false)
    }
}

const showSearchButton = computed(() => lookup.isSupported && !isEmpty(v$.value.Url.$model))

//Clear error message after 5 seconds
watchDebounced(errMessage, v => v ? setTimeout(() => set(errMessage, ''), 5000) : noop())

</script>
<template>
    <form id="bm-add-or-update-form" class="grid grid-cols-1 gap-4 p-4" @submit.prevent="emit('submit')">
        <fieldset>
            <label for="url" class="flex justify-between mb-2 text-sm font-medium text-gray-900 dark:text-white">
                URL
            </label>
            <div class="flex gap-2">
                <input type="text" id="url" class="input" placeholder="https://www.example.com" v-model="v$.Url.$model"
                    :class="{'dirty': v$.Url.$dirty, 'error': v$.Url.$invalid}" required>

                <div class="my-auto">
                    <button type="button" :disabled="!showSearchButton || waiting" @click.prevent="execLookup"
                        id="search-btn" class="btn blue search-btn">
                        <span v-if="waiting" class="mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 animate-spin" viewBox="0 0 15 15">
                                <path fill="currentColor" fill-rule="evenodd"
                                    d="M8 .5V5H7V.5h1ZM5.146 5.854l-3-3l.708-.708l3 3l-.708.708Zm4-.708l3-3l.708.708l-3 3l-.708-.708Zm.855 1.849L14.5 7l-.002 1l-4.5-.006l.002-1Zm-9.501 0H5v1H.5v-1Zm5.354 2.859l-3 3l-.708-.708l3-3l.708.708Zm6.292 3l-3-3l.708-.708l3 3l-.708.708ZM8 10v4.5H7V10h1Z"
                                    clip-rule="evenodd" />
                            </svg>
                        </span>
                        <span v-else>
                            <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                                viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                    stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
            <div v-if="errMessage" class="pl-2">
                <p class="text-xs italic text-red-800 dark:text-red-500">
                    {{ errMessage }}
                </p>
            </div>
        </fieldset>
        <fieldset>
            <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
            <input type="text" id="Name" class="input" placeholder="Hello World" v-model="v$.Name.$model"
                :class="{'dirty': v$.Name.$dirty, 'error': v$.Name.$invalid}" required>
        </fieldset>
        <fieldset>
            <label for="tags" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tags</label>
            <input type="text" id="tags" class="input" placeholder="tag1,tag2,tag3" v-model="tags"
                :class="{'dirty': v$.Tags.$dirty, 'error': v$.Tags.$invalid}">
        </fieldset>
        <fieldset>
            <label for="description"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
            <textarea type="text" id="description" rows="5" class="input" placeholder="This is a bookmark"
                v-model="v$.Description.$model"
                :class="{'dirty': v$.Description.$dirty, 'error': v$.Description.$invalid}" />
        </fieldset>

        <div class="flex justify-end">
            <button id="save-button" type="submit" form="bm-add-or-update-form" class="btn blue">
                Save
            </button>
        </div>
    </form>
</template>

<style scoped lang="scss">

#bm-add-or-update-form {
    .search-btn{

        @apply my-auto px-3 py-2.5;

        &:disabled{
            @apply bg-gray-600;
        }
    }
}

</style>