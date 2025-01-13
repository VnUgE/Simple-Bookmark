<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef } from 'vue';
import { useStore } from '../../store';
import { set, get } from '@vueuse/core';
import { useGeneralToaster, usePassConfirm, useSession, useTotpApi } from '@vnuge/vnlib.browser';
import { defaultTo, isEmpty, isNil } from 'lodash-es';
import { TOTP } from 'otpauth'
import base32Encode from 'base32-encode'
const QrCode = defineAsyncComponent(() => import('qrcode.vue'));
const VOtpInput = defineAsyncComponent(() => import('vue3-otp-input'))

interface TotpConfig {
    secret: string;
    readonly issuer: string;
    readonly algorithm: string;
    readonly digits?: number;
    readonly period?: number;
}

const { KeyStore } = useSession()
const { elevatedApiCall } = usePassConfirm()
const { success, error } = useGeneralToaster()
const store = useStore()
const newTotpConfig = shallowRef<TotpConfig | undefined>()
const totpEnabled = store.mfaIsEnabled('totp')
const totpApi = useTotpApi(store.mfaConfig)

const qrCode = computed(() => {

    const m = get(newTotpConfig);

    if (isNil(m)) {
        return ''
    }

    // Build the totp qr codeurl
    const params = new URLSearchParams()
    params.append('secret', m.secret)
    params.append('issuer', m.issuer)
    params.append('algorithm', m.algorithm)
    params.append('digits', defaultTo(m.digits, 6).toString())
    params.append('period', defaultTo(m.period, 30).toString())

    return `otpauth://totp/${m.issuer}:${store.userName}?${params.toString()}`
})

const showUpdateDialog = computed(() => !isEmpty(get(qrCode)))

const disableTotp = async () => {

    elevatedApiCall(async ({ password, toaster }) =>{
        const { getResultOrThrow } = await totpApi.disable({ password })
        getResultOrThrow();

        toaster.general.success({
            title: 'TOTP Disabled',
            text: 'TOTP has been disabled for your account.'
        })
    })
}

const addOrUpdate = async () => {

    elevatedApiCall(async ({ password }) =>{
        const newConfig = await totpApi.enable({ password });
        
        // Decrypt the server sent secret
        const decSecret = await KeyStore.decryptDataAsync(newConfig.secret);
        // Encode the secret to base32
        newConfig.secret = base32Encode(decSecret, 'RFC3548', { padding: false })

        set(newTotpConfig, newConfig);

        //refresh config
        store.mfaRefreshMethods();
    })
}

const onVerifyOtp = async (code: string) => {
    // Create a new TOTP instance from the current message
    const totp = new TOTP(get(newTotpConfig))

    // validate the code
    const valid = totp.validate({ token: code, window: 4 })

    if (valid) {
        success({
            title: 'Success',
            text: 'Your code is valid and TOPT has been enabled.'
        })

        //Close the dialog
        set(newTotpConfig, undefined)

    } else {
        error({ title: 'The code you entered is invalid.'})
    }
}

</script>

<template>
   
    <div class="flex flex-row items-center justify-between">
        <div class="relative me-4">
            <h4 class="text-base font-bold">
                TOTP
            </h4>
            <span 
                :class="[totpEnabled ? 'visible' : 'invisible' ]"
                class="absolute top-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full -end-5 dark:border-gray-800"
            >
            </span>
        </div>
        <div v-if="totpEnabled" class="flex gap-2">
            <button class="btn light" @click="addOrUpdate()">
                Regenerate
            </button>
            <button class="btn red" @click="disableTotp()">
                Disable
            </button>
        </div>
        <div v-else>
            <button class="btn green" @click="addOrUpdate()">
                Enable
            </button>
        </div>
    </div>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Use Time based One Time Passcodes (TOTP) to secure your account as a second factor authentication.
    </p>
    
    <Dialog :open="showUpdateDialog" title="TOTP Secret" @cancel="">
        <template #body>
            <div class="p-4 pb-8">
                <div class="flex flex-col items-center justify-center">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Scan this QR code with your authenticator app to add this account.
                        </p>
                    </div>
                    <div class="mt-4">
                        <QrCode :size="200" level="L" :value="qrCode" />
                    </div>
                    <div class="w-full mt-4">
                        <input 
                            type="text" 
                            id="disabled-input-2"
                            aria-label="disabled input 2" 
                            class="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                            :value="qrCode" 
                            disabled 
                            readonly
                        >
                    </div>
                  
                     <div class="mx-auto mt-4">
                        <VOtpInput class="otp-input" input-type="letter-numeric" separator=""
                            input-classes="rounded" :num-inputs="6" value="" @on-change=""
                            @on-complete="onVerifyOtp" />
                    </div>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Enter the 6 digit code from your authenticator app to verify.
                    </p>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style lang="scss"></style>