<script setup lang="ts">
import { capitalize, shallowRef, toRefs } from 'vue';
import { type IMfaFlow, type IFidoMfaFlow, apiCall, useMessage, useWait } from '@vnuge/vnlib.browser';
import { toSafeInteger } from 'lodash-es';
import { get } from '@vueuse/core';
import VOtpInput from 'vue3-otp-input';

const emit = defineEmits(['clear'])

const props = defineProps<{
    upgrade: IMfaFlow[]
}>()

const { upgrade } = toRefs(props)
const { waiting } = useWait();
const { onInput } = useMessage();

const selectedMethod = shallowRef<IMfaFlow>()

const SubimitTotp = (code: string) => {

    const method = get(selectedMethod);
    //If a request is still pending, do nothing
    if (get(waiting) || !method) {
        return
    }

    apiCall(async ({ toaster }) => {
       
        const res = await method.submit({ code: toSafeInteger(code) })
        res.getResultOrThrow()

        emit('clear')
       
        toaster.general.success({
            title: 'Success',
            text: 'You have been logged in',
        })
    })
}

const submitFido = () => {
    const method = get(selectedMethod) as IFidoMfaFlow
    //If a request is still pending, do nothing
    if (get(waiting) || !method) {
        return
    }

    apiCall(async ({ toaster }) => {
      
        const res = await method.authenticate(false);
        res.getResultOrThrow()

        emit('clear')
     
        toaster.general.success({
            title: 'Success',
            text: 'You have been logged in',
        })
    })
}

</script>

<template>

    <div id="mutli-factor" class="mt-6">

        <div id="mfa-auth-login" v-if="selectedMethod">
            <div v-if="selectedMethod.type === 'totp'" id="totp-login-form">
                <div class="flex">
                    <div class="mx-auto mt-4">
                        <VOtpInput id="totp-code-input-form" class="otp-input" input-type="letter-numeric" :is-disabled="waiting" separator=""
                            input-classes="primary input rounded" :num-inputs="6" value="" @on-change="onInput"
                            @on-complete="SubimitTotp" />
                    </div>
                </div>

                <p id="helper-text-explanation" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Please enter your 6 digit TOTP code from your authenticator app.
                </p>

            </div>

            <div v-else-if="selectedMethod.type === 'fido'">
                <div class="flex">
                    <div class="mx-auto mt-4">
                        <button @click="submitFido" class="btn">
                            Begin Authentication
                        </button>
                    </div>
                </div>
            </div>

            <div v-else>
                <div class="flex">
                    <div class="mx-auto mt-4">
                        <p>This client does not support this method</p>
                    </div>
                </div>
            </div>

            <div class="mt-8">
                <div class="mx-auto w-fit">
                    <button @click="selectedMethod = undefined" class="flex border-b text-sm">
                        <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="m14 8-4 4 4 4" />
                        </svg>

                        <span class="pr-3">Back</span>
                    </button>
                </div>
            </div>
        </div>

        <div id="mfa-auth-selection" v-else class="">

            <div class="flex flex-col space-y-4 md:space-y-6">
                <div class="flex justify-center">
                    <h2 class="">Please select a 2fa method</h2>
                </div>
                <div class="flex justify-center w-full">
                    <div class="flex flex-col space-y-2 md:space-y-4 flex-auto max-w-[12rem]">
                        <button v-for="method in upgrade" @click="selectedMethod = method" class="btn w-full">
                            {{ capitalize(method.type) }}
                        </button>
                    </div>
                </div>
            </div>

        </div>

    </div>

</template>

<style lang="scss">
#totp-code-input-form {
    input.input.primary {
        @media screen and (max-width: 440px) {
            @apply w-9 h-9 text-center;
        }
    }
}
</style>