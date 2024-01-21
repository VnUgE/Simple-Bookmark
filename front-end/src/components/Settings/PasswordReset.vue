<script setup lang="ts">
import { computed, defineAsyncComponent, shallowReactive } from 'vue';
import { useStore } from '../../store';
import { get, useToggle } from '@vueuse/core';
import { MfaMethod, apiCall, useUser, useVuelidateWrapper } from '@vnuge/vnlib.browser';
import { includes, isEmpty, toSafeInteger } from 'lodash-es';
import { useVuelidate } from '@vuelidate/core'
import { required, maxLength, minLength, helpers } from '@vuelidate/validators'
const Dialog = defineAsyncComponent(() => import('../global/Dialog.vue'));

const store = useStore();
const { resetPassword } = useUser()
const totpEnabled = computed(() => includes(store.mfaEndabledMethods, MfaMethod.TOTP))

const [ isOpen, toggleOpen ] = useToggle(false)
const vState = shallowReactive({
    current: '',
    newPassword: '',
    repeatPassword: '',
    totpCode: ''
})

const rules = computed(() => {
    return {
        current: {
            required: helpers.withMessage('Current password cannot be empty', required),
            minLength: helpers.withMessage('Current password must be at least 8 characters', minLength(8)),
            maxLength: helpers.withMessage('Current password must have less than 128 characters', maxLength(128))
        },
        newPassword: {
            notOld: helpers.withMessage('New password cannot be the same as your current password', (value: string) => value != vState.current),
            required: helpers.withMessage('New password cannot be empty', required),
            minLength: helpers.withMessage('New password must be at least 8 characters', minLength(8)),
            maxLength: helpers.withMessage('New password must have less than 128 characters', maxLength(128))
        },
        repeatPassword: {
            sameAs: helpers.withMessage('Your new passwords do not match', (value: string) => value == vState.newPassword),
            required: helpers.withMessage('Repeast password cannot be empty', required),
            minLength: helpers.withMessage('Repeast password must be at least 8 characters', minLength(8)),
            maxLength: helpers.withMessage('Repeast password must have less than 128 characters', maxLength(128))
        },
        totpCode: {
            required: helpers.withMessage('TOTP code cannot be empty', (value: string) => get(totpEnabled) ? !isEmpty(value) : true),
            minLength: helpers.withMessage('TOTP code must be at least 6 characters', minLength(6)),
            maxLength: helpers.withMessage('TOTP code must have less than 12 characters', maxLength(12))
        }
    }
})

const v$ = useVuelidate(rules, vState)
const { validate } = useVuelidateWrapper(v$ as any)

const onSubmit = async () => {
    if (!await validate()) return

    apiCall(async ({toaster}) => {
        //Rest password and pass totp code
        const { getResultOrThrow } = await resetPassword(vState.current, vState.newPassword, { totp_code: toSafeInteger(vState.totpCode) })
        getResultOrThrow()

        toaster.general.success({
            title: 'Password Reset',
            text: 'Your password has been reset'
        });

        onCancel()
    })
}

const onCancel = () => {
    vState.current = ''
    vState.newPassword = ''
    vState.repeatPassword = ''
    vState.totpCode = ''
    v$.value.$reset()
    toggleOpen(false)
}

</script>

<template>
    <div class="">

        <div class="flex flex-row justify-between w-full">
            <h3 class="text-xl font-bold">Password</h3>
            
            <div class="flex flex-row justify-end">
                <button class="btn blue" @click="toggleOpen(true)">Reset Password</button>
            </div>
        </div>

        <Dialog :open="isOpen" title="Reset Password" @cancel="onCancel">
            <template #body>
                <div class="p-4">

                     <form @submit.prevent="onSubmit">
                      
                        <div class="mb-4">
                            <label for="current_password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Current</label>
                            <input 
                                v-model="v$.current.$model"
                                type="password" 
                                id="current_password" 
                                class="input" 
                                :class="{ 'error': v$.current.$error, 'dirty': v$.current.$dirty }"
                                placeholder="•••••••••" 
                                required
                            >
                        </div> 
                        <div class="mb-4">
                            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New Password</label>
                            <input 
                                v-model="v$.newPassword.$model"
                                type="password" 
                                id="password" 
                                class="input" 
                                :class="{ 'error': v$.newPassword.$error, 'dirty': v$.newPassword.$dirty }"
                                placeholder="•••••••••" 
                                required
                            >
                        </div> 
                        <div class="mb-4">
                            <label for="confirm_password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm password</label>
                            <input 
                                v-model="v$.repeatPassword.$model"
                                type="password" 
                                id="confirm_password" 
                                class="input" 
                                :class="{ 'error': v$.repeatPassword.$error, 'dirty': v$.repeatPassword.$dirty }"
                                placeholder="•••••••••" 
                                required
                            >
                        </div> 
                        <div v-if="totpEnabled" class="mb-4">
                            <label for="totp_code" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">TOTP Code</label>
                            <input 
                                v-model="v$.totpCode.$model"
                                type="text" 
                                id="totp_code" 
                                class="input" 
                                :class="{ 'error': v$.totpCode.$error, 'dirty': v$.totpCode.$dirty }"
                                placeholder="6 Digit Code" 
                                required
                            >
                        </div>
                        <div class="ml-auto w-fit">
                            <button type="submit" class="btn blue">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </Dialog>
    </div>
</template>