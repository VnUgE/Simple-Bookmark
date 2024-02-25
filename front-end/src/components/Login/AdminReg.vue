<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, maxLength, minLength, email, helpers } from '@vuelidate/validators'
import { useVuelidateWrapper, apiCall, useWait } from '@vnuge/vnlib.browser'
import { useStore } from '../../store'

const { waiting } = useWait();
const store = useStore();

const vState = reactive({ username: '', password: '', repeat: ''})

const rules = computed(() =>({
    username: {
        required: helpers.withMessage('Email cannot be empty', required),
        email: helpers.withMessage('Your email address is not valid', email),
        maxLength: helpers.withMessage('Email address must be less than 50 characters', maxLength(50))
    },
    password: {
        required: helpers.withMessage('Password cannot be empty', required),
        minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8)),
        maxLength: helpers.withMessage('Password must have less than 128 characters', maxLength(128))
    },
    repeat:{
        required: helpers.withMessage('Password cannot be empty', required),
        minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8)),
        maxLength: helpers.withMessage('Password must have less than 128 characters', maxLength(128)),
        match: helpers.withMessage('Passwords must match', (value: string) => value === vState.password)
    }
}));

const v$ = useVuelidate(rules, vState)
const { validate } = useVuelidateWrapper(v$ as any);

const onSubmit = async () => {

    // If the form is not valid set the error message
    if (!await validate()) {
        return
    }

    // Run login in an apicall wrapper
    await apiCall(async ({ toaster }) => {

        const res = await store.registation.api.registerAdmin(
            v$.value.username.$model,
            v$.value.password.$model
        );

        const message = res.getResultOrThrow();

        toaster.general.success({
            title: 'Success!',
            text: message
        })
    })
}
</script>

<template>
    <form class="space-y-4 md:space-y-6" id="admin-registation" action="#" @submit.prevent="onSubmit" :disabled="waiting">
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
        <fieldset>
            <label for="repeat-password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Repeat Password</label>
            <input type="password" name="repeat-password" id="repeat-password" class="input" placeholder="••••••••" required
                v-model="v$.repeat.$model">
        </fieldset>
        <button form="admin-registation" type="submit" class="btn">Register</button>
    </form>
    <p class="py-4 text-sm text-red-500">
        This tab is only visible when the server is in setup mode. You can create as many admin accounts as you like now. 
    </p>
</template>

<style scoped lang="scss"></style>