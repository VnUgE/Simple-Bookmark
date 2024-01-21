<script setup lang="ts">
import { toRefs } from 'vue';
import { IMfaFlowContinuiation, apiCall, useMessage, useWait } from '@vnuge/vnlib.browser';
import { toSafeInteger } from 'lodash-es';
import VOtpInput from 'vue3-otp-input';

const emit = defineEmits(['clear'])

const props = defineProps<{
    upgrade: IMfaFlowContinuiation
}>()

const { upgrade } = toRefs(props)
const { waiting } = useWait();
const { onInput } = useMessage();

const SubimitTotp = (code: string) => {

    //If a request is still pending, do nothing
    if (waiting.value) {
        return
    }

    apiCall(async ({ toaster }) => {
        //Submit totp code
        const res = await upgrade.value.submit({ code: toSafeInteger(code) })
        res.getResultOrThrow()

        emit('clear')

        // Push a new toast message
        toaster.general.success({
            title: 'Success',
            text: 'You have been logged in',
        })
    })
}

</script>

<template>
    <div id="totp-login-form">
        <div class="flex">
            <div class="mx-auto mt-4">
                <VOtpInput class="otp-input" input-type="letter-numeric" :is-disabled="waiting" separator=""
                    input-classes="primary input rounded" :num-inputs="6" value="" @on-change="onInput"
                    @on-complete="SubimitTotp" />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
</style>