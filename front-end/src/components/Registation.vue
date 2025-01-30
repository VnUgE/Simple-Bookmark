<script setup lang="ts">
import { apiCall, useWait } from '@vnuge/vnlib.browser'
import { storeToRefs } from 'pinia'
import { useQuery, useStore } from '../store'
import { computed, ref, watch } from 'vue';
import { get } from '@vueuse/core';
import { delay, isEmpty, noop } from 'lodash-es';
import { decodeJwt } from 'jose';

const store = useStore();
const { siteTitle } = storeToRefs(store);
const { waiting } = useWait();

const enabled = computed(() => store.registation.status?.enabled === true);

const password = ref();
const repeatPassword = ref();
const token = useQuery("token")

const tVals = computed(() => {
    try{
        const { sub, level, exp } = decodeJwt<{level:number, sub:string, exp:number}>(get(token)!)
        const isPrilageed = (level & ( 1 << 0x08)) !== 0;
        const isExpired = exp < Date.now() / 1000;
        return { email: sub,  isPrilageed , isExpired }
    }
    catch{
        return { email: '', isPrilageed: false, isExpired: true }
    }
})

const onSubmit = () =>{

    const passwrd = get(password);
    if(isEmpty(passwrd)){
        return;
    }

    apiCall(async ({ toaster }) => {
        const result = await store.registation.api.completeRegistation(get(token)!, passwrd)
        const message = result.getResultOrThrow();

        toaster.general.success({
            title:'Completed!',
            text: message
        })

        //redirect to login page on success
        delay(() => {
            //Clear token value
            window.location.assign('/')
        } , 1000)
    });
}

//If token or enabled changes and both are true, reload and clear all arguments
watch([enabled, token], ([en, t]) => (en && t) ? noop() : window.location.assign('/'))

</script>
<template>
    <section id="reg-page" class="flex-auto">
        <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-24">
            <div class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                <span class="p-2 mr-2 bg-blue-500 rounded-full">
                    <svg class="w-5 h-5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor" viewBox="0 0 14 20">
                        <path
                            d="M13 20a1 1 0 0 1-.64-.231L7 15.3l-5.36 4.469A1 1 0 0 1 0 19V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17a1 1 0 0 1-1 1Z" />
                    </svg>
                </span>
                <span class="self-center font-semibold whitespace-nowrap">{{ siteTitle }}</span>
            </div>
            <div
                class="w-full bg-white rounded shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                <div class="p-6 space-y-4 md:space-y-6 sm:p-8">

                     <!-- password/username login -->
                    <h1
                        class="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl dark:text-white">
                        Sign up
                    </h1>

                    <div class="" v-if="tVals.isExpired">
                        <p class="py-4 text-lg text-center text-red-500 dark:text-red-400">
                            Your sign up link has expired
                        </p>
                        <div class="mt-4">
                            <a href="/">
                                <button class="w-full btn blue">Go back</button>
                            </a>
                        </div>
                    </div>

                    <form v-else class="space-y-4 md:space-y-6" action="#" @submit.prevent="onSubmit" :disabled="waiting">
                        <fieldset>
                            <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                            <input type="email" name="email" id="email" class="input" placeholder="" disabled
                                :value="tVals.email"
                            >
                        </fieldset>
                        <fieldset>
                            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                            <input type="password" name="password" id="password" class="input" placeholder="••••••••" required
                                v-model="password"
                            >
                        </fieldset>
                        <fieldset>
                            <label for="repeat-password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Repeat Password</label>
                            <input type="password" name="repeat-password" id="repeat-password" class="input" placeholder="••••••••" required
                                v-model="repeatPassword"
                            >
                        </fieldset>
                        <fieldset>
                            <div class="flex items-center">
                                <input disabled id="disabled-checked-checkbox" type="checkbox" :value="tVals.isPrilageed" 
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                <label for="disabled-checked-checkbox" class="text-sm font-medium text-gray-400 ms-2 dark:text-gray-500">
                                    Can add users
                                </label>
                            </div>
                        </fieldset>
                        <button type="submit" class="btn">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    </section>
</template>

<style lang="scss">
#reg-page {

    button[type="submit"] {
        @apply w-full focus:ring-4 focus:outline-none font-medium rounded text-sm px-5 py-2.5 text-center;
        @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800;
    }
}</style>