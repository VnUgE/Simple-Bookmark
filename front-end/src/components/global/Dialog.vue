<script setup lang="ts">
import { noop } from 'lodash-es'
import { ref, toRefs } from 'vue'
import { Dialog } from '@headlessui/vue'
import { onClickOutside, get } from '@vueuse/core'

const emit = defineEmits(['cancel'])
const props = defineProps<{ title: string | undefined, open: boolean }>()

const { open, title } = toRefs(props)

const dialog = ref(null)
const cancel = () => emit('cancel')

//Cancel prompt when user clicks outside of dialog, only when its open
onClickOutside(dialog, () => get(open) ? cancel() : noop())

</script>
<template>
    <!-- Main modal -->
    <Dialog :open="open" id="static-modal" data-modal-backdrop="static" tabindex="-1"
        class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-20 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div class="relative w-full max-w-xl max-h-full p-4 mx-auto mt-16 md:mt-32">
            <!-- Modal content -->
            <div class="relative bg-white rounded shadow dark:bg-gray-700" ref="dialog">
                <!-- Modal header -->
                <div class="flex items-center justify-between p-3 border-b rounded-t md:px-5 dark:border-gray-600">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                        {{ title }}
                    </h3>
                    <button @click="cancel()" type="button"
                        class="inline-flex items-center justify-center w-8 h-8 text-sm text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900 ms-auto dark:hover:bg-gray-600 dark:hover:text-white"
                        data-modal-hide="static-modal">
                        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 14 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                
                <!-- Modal body -->
               <slot name="body" />

            </div>
        </div>
    </Dialog>
</template>