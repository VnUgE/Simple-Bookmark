<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { join, split } from 'lodash-es';

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

</script>
<template>
    <form class="grid grid-cols-1 gap-4 p-4" @submit.prevent="emit('submit')">
        <fieldset>
            <label for="url" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">URL</label>
            <input type="text" id="url" class="input" placeholder="https://www.example.com"
                v-model="v$.Url.$model"
                :class="{'dirty': v$.Url.$dirty, 'error': v$.Url.$invalid}"
                required
            >
        </fieldset>
        <fieldset>
            <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
            <input type="text" id="Name" class="input" placeholder="Hello World"
                v-model="v$.Name.$model"
                :class="{'dirty': v$.Name.$dirty, 'error': v$.Name.$invalid}"
                required
            >
        </fieldset>
         <fieldset>
            <label for="tags" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tags</label>
            <input type="text" id="tags" class="input" placeholder="tag1,tag2,tag3"
                v-model="tags"
                :class="{'dirty': v$.Tags.$dirty, 'error': v$.Tags.$invalid}"
            >
        </fieldset>
        <fieldset>
            <label for="description" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
            <textarea type="text" id="description" rows="5" class="input" placeholder="This is a bookmark"
                v-model="v$.Description.$model"
                :class="{'dirty': v$.Description.$dirty, 'error': v$.Description.$invalid}"
            />
        </fieldset>
       
        <div class="flex justify-end">
            <button type="submit" class="btn blue">
                Submit
            </button>
        </div>
    </form>
</template>

<style scoped lang="scss">input.search {
    @apply ps-10 p-2.5 border block w-full text-sm rounded;
    @apply bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500;
}

button.search {
    @apply p-2.5 ms-2 text-sm font-medium text-white bg-blue-700 rounded border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
}
</style>