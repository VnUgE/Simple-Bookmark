<script setup lang="ts">
import { defaultTo } from 'lodash-es'
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useConfirm } from '@vnuge/vnlib.browser'
import Dialog from './Dialog.vue'

interface MessageType{
  title: string,
  text: string
}

//Use component side of confirm
const { isRevealed, confirm, cancel, onReveal } = useConfirm()

const dialog = ref(null)
const message = ref<MessageType | undefined>()

//Cancel prompt when user clicks outside of dialog, only when its open
onClickOutside(dialog, () => isRevealed.value ? cancel() : null)

//Set message on reveal
onReveal(m => message.value = defaultTo(m, {}));


</script>
<template>
  <!-- Main modal -->
  <Dialog title="Confirm?" :open="isRevealed" @cancel="cancel">
      <template #body>
        <div class="p-4 space-y-4 md:p-5">
            <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {{ message?.text }}
            </p>
        </div>
        <!-- Modal footer -->
        <div class="flex items-center justify-end p-4 border-t border-gray-200 rounded-b md:p-5 dark:border-gray-600">
            <button 
            @click="confirm()" 
            type="button"
            class="btn blue">
              Confirm
            </button>
          
            <button 
              @click="cancel()" 
              type="button" 
              class="btn light">
              Cancel
            </button>
        </div>
      </template>
  </Dialog>

</template>

<style scoped lang="scss">
.modal-entry{
  @apply hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full;
}

.modal-content-container{
  @apply text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white;
}
</style>