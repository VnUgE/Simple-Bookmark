<script setup lang="ts">
import { ref, shallowRef, reactive, computed, type Ref } from 'vue'
import { useTimeoutFn, set } from '@vueuse/core'
import { useVuelidate } from '@vuelidate/core'
import { isArray } from 'lodash-es'
import { required, maxLength, minLength, email, helpers } from '@vuelidate/validators'
import {
    useVuelidateWrapper, useMfaLogin, totpMfaProcessor,
    apiCall, useMessage, useWait, debugLog,
    fidoMfaProcessor,
    type WebMessage,
    type IMfaFlow,
    type IMfaContinuation,
    type VuelidateInstance
} from '@vnuge/vnlib.browser'
import { useStore } from '../../store'
import MfaSelection from './MfaContinue.vue'

const { setMessage } = useMessage();
const { waiting } = useWait();
const { account } = useStore()

interface LoginAccountPropertyData {
    readonly enforce_email: boolean;
    readonly username_max_chars: number;
}

//Stores dynamic account data from the server
const loginData = account.getPropertyData<LoginAccountPropertyData>('login', {
    enforce_email: false,
    username_max_chars: 50
});

const { login } = useMfaLogin([
    totpMfaProcessor(),     //Enable totp mfa support
    fidoMfaProcessor()      //Enable fido mfa support
])

const mfaUpgrades = shallowRef<IMfaFlow[]>();

const clearUpgrade = () => {
    set(mfaUpgrades, []);
}

const mfaTimeout = ref<number>(600 * 1000);
const mfaTimer = useTimeoutFn(() => {
    //Clear upgrade message
    clearUpgrade();
    setMessage('Your request has expired')
}, mfaTimeout, { immediate: false })

const vState = reactive({ username: '', password: '' })
const rules = computed(() => ({
    username: {
        required: helpers.withMessage('Email cannot be empty', required),
        email: helpers.withMessage('Your email address is not valid', loginData.value.enforce_email ? email : () => true),
        maxLength: helpers.withMessage('Email address must be less than 50 characters', maxLength(loginData.value.username_max_chars))
    },
    password: {
        required: helpers.withMessage('Password cannot be empty', required),
        minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8)),
        maxLength: helpers.withMessage('Password must have less than 128 characters', maxLength(128))
    }
}));

const v$ = useVuelidate(rules, vState)
const { validate } = useVuelidateWrapper(v$ as Ref<VuelidateInstance>);

const onSubmit = async () => {

    // If the form is not valid set the error message
    if (!await validate()) {
        return
    }

    // Run login in an apicall wrapper
    await apiCall(async ({ toaster }) => {

        //Attempt to login
        const response = await login({
            userName: v$.value.username.$model,
            password: v$.value.password.$model
        });

        debugLog('Mfa-login', response);

        //See if the response is a web message
        if ((response as WebMessage).getResultOrThrow) {
            (response as WebMessage).getResultOrThrow();
        }

        //Try to get response as a flow continuation
        const { methods, expires } = response as IMfaContinuation

        // Response is an mfa upgrade
        if (isArray(methods) && methods.length > 0) {

            /**
             * If mfa has a type assicated, then we should have a handler matched 
             * with it to continue the flow
             * 
             * All mfa upgrades will have a token expiration, and an assoicated 
             * type string name (string) 
             */

            set(mfaUpgrades, methods);

            set(mfaTimeout, expires! * 1000);

            mfaTimer.start();
        }
        //If login without mfa was successful
        else if ((response as WebMessage).success) {
            // Push a new toast message
            toaster.general.success({
                title: 'Success',
                text: 'You have been logged in',
            })

            // Refresh the account data
            account.refresh();
        }
    })
}

const mfaClear = () => {
    mfaTimer.stop();
    clearUpgrade();
    account.refresh();
}

</script>

<template>
    <form v-if="mfaUpgrades" @submit.prevent="" class="max-w-sm mx-auto">

        <MfaSelection :upgrade="mfaUpgrades" @clear="mfaClear" />

    </form>
    <form v-else class="space-y-4 md:space-y-6" action="#" @submit.prevent="onSubmit" :disabled="waiting">
        <fieldset>
            <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
            <input type="email" name="email" id="email" class="input" placeholder="name@company.com" required
                v-model="v$.username.$model">
        </fieldset>
        <fieldset>
            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
            <input type="password" name="password" id="password" class="input" placeholder="••••••••" required
                v-model="v$.password.$model">
        </fieldset>
        <button type="submit" class="flex justify-center btn">
            <span v-if="waiting" class="mx-auto animate-spin">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 15 15">
                    <path fill="currentColor" fill-rule="evenodd"
                        d="M8 .5V5H7V.5h1ZM5.146 5.854l-3-3l.708-.708l3 3l-.708.708Zm4-.708l3-3l.708.708l-3 3l-.708-.708Zm.855 1.849L14.5 7l-.002 1l-4.5-.006l.002-1Zm-9.501 0H5v1H.5v-1Zm5.354 2.859l-3 3l-.708-.708l3-3l.708.708Zm6.292 3l-3-3l.708-.708l3 3l-.708.708ZM8 10v4.5H7V10h1Z"
                        clip-rule="evenodd" />
                </svg>
            </span>
            <span v-else>
                Sign in
            </span>
        </button>
    </form>
</template>

<style scoped lang="scss">

</style>