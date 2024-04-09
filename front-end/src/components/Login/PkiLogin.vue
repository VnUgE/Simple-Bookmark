<script setup lang="ts">
import { isEmpty } from 'lodash-es';
import { apiCall, debugLog, useMessage, useWait } from '@vnuge/vnlib.browser';
import { ref } from 'vue'
import { decodeJwt } from 'jose'
import { useStore } from '../../store';

const { setMessage } = useMessage()
const { pkiAuth } = useStore()
const { waiting } = useWait()

const otp = ref('')

const onSubmit = () => {

    apiCall(async () => {
        if (isEmpty(otp.value)) {
            setMessage('Please enter your OTP')
            return
        }
        try{
          //try to decode the jwt to confirm its form is valid
          const jwt = decodeJwt(otp.value)
          debugLog(jwt)
        }
        catch{
            setMessage('Your OTP is not valid')
            return
        }
        await pkiAuth.login(otp.value)
    })
}
</script>

<template>
  <form id="pki-login-form" class="max-w-sm mx-auto" @submit.prevent="onSubmit">
    <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
      Paste your one time password (OTP)
    </label>
    <textarea id="message" rows="5" v-model="otp"
      class="block p-2.5 w-full text-sm text-gray-900 bg-transparent rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      placeholder="Enter your OTP">
    </textarea>

    <button type="submit" for="pki-login-form" class="flex justify-center mt-4 btn">
      <span v-if="waiting" class="mx-auto animate-spin">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 15 15">
          <path fill="currentColor" fill-rule="evenodd"
            d="M8 .5V5H7V.5h1ZM5.146 5.854l-3-3l.708-.708l3 3l-.708.708Zm4-.708l3-3l.708.708l-3 3l-.708-.708Zm.855 1.849L14.5 7l-.002 1l-4.5-.006l.002-1Zm-9.501 0H5v1H.5v-1Zm5.354 2.859l-3 3l-.708-.708l3-3l.708.708Zm6.292 3l-3-3l.708-.708l3 3l-.708.708ZM8 10v4.5H7V10h1Z"
            clip-rule="evenodd" />
        </svg>
      </span>
      <span v-else>
        Submit
      </span>
  </button>

  </form>
</template>