<script setup lang="ts">
import { ref, shallowRef, reactive } from 'vue'
import { useTimeoutFn, set } from '@vueuse/core'
import { useVuelidate } from '@vuelidate/core'
import { isEqual } from 'lodash-es'
import { required, maxLength, minLength, email, helpers } from '@vuelidate/validators'
import {
    useVuelidateWrapper, useMfaLogin, totpMfaProcessor, IMfaFlowContinuiation, MfaMethod,
    apiCall, useMessage, useWait, debugLog, WebMessage
} from '@vnuge/vnlib.browser'

import OptInput from '../global/OtpInput.vue'//So small it does not need to be async

const { setMessage } = useMessage();
const { waiting } = useWait();

//Setup mfa login with TOTP support
const { login } = useMfaLogin([ totpMfaProcessor() ])

const mfaUpgrade = shallowRef<IMfaFlowContinuiation | undefined>();

const mfaTimeout = ref<number>(600 * 1000);
const mfaTimer = useTimeoutFn(() => {
    //Clear upgrade message
    set(mfaUpgrade, undefined);
    setMessage('Your TOTP request has expired')
}, mfaTimeout, { immediate: false })

const vState = reactive({ username: '', password: '' })

const rules = {
    username: {
        required: helpers.withMessage('Email cannot be empty', required),
        email: helpers.withMessage('Your email address is not valid', email),
        maxLength: helpers.withMessage('Email address must be less than 50 characters', maxLength(50))
    },
    password: {
        required: helpers.withMessage('Password cannot be empty', required),
        minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8)),
        maxLength: helpers.withMessage('Password must have less than 128 characters', maxLength(128))
    }
}

const v$ = useVuelidate(rules, vState)
const { validate } = useVuelidateWrapper(v$ as any);

const onSubmit = async () => {

    // If the form is not valid set the error message
    if (!await validate()) {
        return
    }

    // Run login in an apicall wrapper
    await apiCall(async ({ toaster }) => {

        //Attempt to login
        const response = await login(
            v$.value.username.$model,
            v$.value.password.$model
        );

        debugLog('Mfa-login', response);

        //See if the response is a web message
        if (response.getResultOrThrow) {
            (response as WebMessage).getResultOrThrow();
        }

        //Try to get response as a flow continuation
        const mfa = response as IMfaFlowContinuiation

        // Response is a totp upgrade request
        if (isEqual(mfa.type, MfaMethod.TOTP)) {
            //Store the upgrade message
            set(mfaUpgrade, mfa);
            //Setup timeout timer
            set(mfaTimeout, mfa.expires! * 1000);
            mfaTimer.start();
        }
        //If login without mfa was successful
        else if (response.success) {
            // Push a new toast message
            toaster.general.success({
                title: 'Success',
                text: 'You have been logged in',
            })
        }
    })
}
</script>

<template>
    <form v-if="mfaUpgrade" @submit.prevent="" class="max-w-sm mx-auto">
        <OptInput :upgrade="mfaUpgrade" />
        <p id="helper-text-explanation" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Please enter your 6 digit TOTP code from your authenticator app.
        </p>
    </form>
    <form v-else class="space-y-4 md:space-y-6" action="#" @submit.prevent="onSubmit" :disabled="waiting">
        <fieldset>
            <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
            <input type="email" name="email" id="email" class="input" placeholder="name@company.com" required
                v-model="v$.username.$model"
            >
        </fieldset>
        <fieldset>
            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
            <input type="password" name="password" id="password" class="input" placeholder="••••••••" required
                    v-model="v$.password.$model"
            >
        </fieldset>
        <button type="submit" class="btn">Sign in</button>
    </form>
</template>

<style scoped lang="scss">

</style>