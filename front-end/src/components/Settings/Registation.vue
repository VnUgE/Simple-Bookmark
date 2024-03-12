<script setup lang="ts">
import { computed, defineAsyncComponent, ref, shallowReactive, shallowRef } from 'vue';
import { useStore } from '../../store';
import { get, set, useClipboard, useTimeAgo, useToggle } from '@vueuse/core';
import { apiCall, useVuelidateWrapper } from '@vnuge/vnlib.browser';
import { defaultTo } from 'lodash-es';
import { useVuelidate } from '@vuelidate/core'
import { required, maxLength, minLength, helpers, email } from '@vuelidate/validators'
const Dialog = defineAsyncComponent(() => import('../global/Dialog.vue'));

const store = useStore();
const { copy, copied } = useClipboard()

const [isOpen, toggleOpen] = useToggle(false)
const vState = shallowReactive({ email: '' })

const canInvite = ref<boolean>(false)
const inviteLink = shallowRef<string | undefined>()

const expirationDate = computed(() => Date.now() + (1000 * defaultTo(store.registation.status?.link_expiration, 0)))
const fromNowTime = useTimeAgo(expirationDate)

const rules = computed(() => {
    return {
        email: { 
            required: helpers.withMessage('Email is required', required), 
            maxLength: helpers.withMessage('Email must be less than 255 characters', maxLength(255)),
            minLength: helpers.withMessage('Email must be at least 3 characters', minLength(3)),
            email: helpers.withMessage('Email must be a valid email', email)
        },
    }
})

const v$ = useVuelidate(rules, vState)
const { validate } = useVuelidateWrapper(v$ as any)

const onSubmit = async () => {
    if (!await validate()) return

    apiCall(async () => {
        //Rest password and pass totp code
        const { link } = await store.registation.api.createSignupLink(vState.email, get(canInvite))
        set(inviteLink, link)
    })
}

const onCancel = () => {
    vState.email = ''
    v$.value.$reset()
    set(canInvite, false)
    set(inviteLink, undefined)
    toggleOpen(false)
}

</script>

<template>
    <div class="">

        <div class="flex flex-row justify-between w-full">
            <h3 class="text-xl font-bold">Invite Links</h3>

            <div class="flex flex-row justify-end">
                <button class="btn blue" @click="toggleOpen(true)">Invite User</button>
            </div>
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create a one-time invite link you can send to add a new user to your server.
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
            Links expire <span class="text-blue-500">{{ fromNowTime }}</span>
        </p>
        <Dialog :open="isOpen" title="Invite User" @cancel="onCancel">
            <template #body>
                <div class="p-4">

                    <div v-if="inviteLink" class="">
                         <p class="my-2 text-lg font-medium text-center text-gray-900 dark:text-white">
                            Link expires {{ fromNowTime }}
                        </p>

                        <label for="invite-link" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Invite link
                        </label>
                        <input 
                            :value="inviteLink" 
                            type="url" 
                            id="invite-link" 
                            class="input"
                            readonly
                        >

                        <div class="mt-4 ml-auto w-fit">
                            <button @click="copy(inviteLink)" type="submit" :disabled="copied" class="btn blue">
                                {{ copied ? 'Copied!' : 'Copy' }}
                            </button>
                        </div>

                    </div>

                    <form v-else @submit.prevent="onSubmit">

                        <fieldset class="mb-4">
                            <label for="user-email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email address</label>
                            <input v-model="v$.email.$model" type="email" id="user-email" class="input"
                                :class="{ 'error': v$.email.$error, 'dirty': v$.email.$dirty }" 
                                placeholder="user@simplebookmark.com"
                                required
                            >
                        </fieldset>

                        <fieldset class="px-2">
                            <h4 class="font-bold text-gray-700 dark:text-white">Permissions</h4>
                            <div class="flex items-center mt-2 mb-4">
                                <input id="can-invite-input" type="checkbox" v-model="canInvite" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                <label for="can-invite-input" class="text-sm font-medium text-gray-900 ms-2 dark:text-gray-300">Can invite users</label>
                            </div>
                        </fieldset>

                        <div class="ml-auto w-fit">
                            <button type="submit" class="btn blue">
                                Create Link
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </Dialog>
    </div>
</template>