<script setup lang="ts">
import { isEmpty } from 'lodash-es';
import { apiCall, debugLog, useMessage } from '@vnuge/vnlib.browser';
import { ref } from 'vue'
import { decodeJwt } from 'jose'
import { useStore } from '../../store';

const { setMessage } = useMessage()
const { pkiAuth } = useStore()

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
      <textarea 
        id="message" rows="5"
        v-model="otp"
        class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
        placeholder="Enter your OTP"
    >
    </textarea>
    
      <button type="submit" for="pki-login-form" class="mt-4 btn">Submit</button>
    
    </form>
</template>