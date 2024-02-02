<script setup lang="ts">
import { defaultTo, noop } from 'lodash-es'
import { reactive, ref } from 'vue'
import { get, onClickOutside } from '@vueuse/core'
import { usePassConfirm, useVuelidateWrapper } from '@vnuge/vnlib.browser'
import { useVuelidate } from '@vuelidate/core'
import { helpers, required, maxLength } from '@vuelidate/validators'
import Dialog from './Dialog.vue'

interface MessageType{
  title: string,
  text: string
}

//Use component side of pw prompt
const { isRevealed, confirm, cancel, onReveal } = usePassConfirm()

const dialog = ref(null)
const message = ref<MessageType | undefined>()

const pwState = reactive({ password: '' })

const rules = {
  password: {
    required: helpers.withMessage('Please enter your password', required),
    maxLength: helpers.withMessage('Password must be less than 100 characters', maxLength(100))
  }
}

const v$ = useVuelidate(rules, pwState, { $lazy: true })

//Wrap validator so we an display error message on validation, defaults to the form toaster
const { validate } = useVuelidateWrapper(v$ as any);

const formSubmitted = async function () {
  //Calls validate on the vuelidate instance
  if (!await validate()) {
    return
  }

  //Store pw copy
  const password = v$.value.password.$model;

  //Clear the password form
  v$.value.password.$model = '';
  v$.value.$reset();

  //Pass the password to the confirm function
  confirm({ password });
}

const close = function () {
  // Clear the password form
  v$.value.password.$model = '';
  v$.value.$reset();

  //Close prompt
  cancel(null);
}

//Cancel prompt when user clicks outside of dialog, only when its open
onClickOutside(dialog, () => get(isRevealed) ? close() : noop())

//Set message on reveal
onReveal(m => message.value = defaultTo(m, {}));

</script>
<template>
  <!-- Main modal -->
  <Dialog title="Enter Password" :open="isRevealed" @cancel="cancel">
      <template #body>
        <div class="p-4 space-y-4 md:p-5">
            <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Please enter your password in order to continue.
            </p>
            <form class="mb-6" @submit="formSubmitted">
                <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                <input 
                  type="password" 
                  id="password"
                  v-model.trim="v$.password.$model" 
                  class="bg-transparent border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                  placeholder="•••••••••"
                  required
                 >
            </form> 
        </div>
        <!-- Modal footer -->
        <div class="flex items-center justify-end p-4 border-t border-gray-200 rounded-b md:p-5 dark:border-gray-600">
            <button 
             @click="formSubmitted" 
             type="button"
             class="btn blue"
            >
              Confirm
            </button>
          
            <button 
              @click="close" 
              type="button" 
              class="btn light">
              Cancel
            </button>
        </div>
      </template>
  </Dialog>

</template>