<script setup lang="ts">
import { shallowRef } from 'vue';
import { useStore } from '../../store';
import { get, refDefault, set, useToggle } from '@vueuse/core';
import { PkiPublicKey, debugLog, useGeneralToaster, usePassConfirm, useOtpApi } from '@vnuge/vnlib.browser';
import { isEmpty, toLower } from 'lodash-es';

const store = useStore();
const { reveal } = usePassConfirm();
const { elevatedApiCall } = usePassConfirm()
const toaster = useGeneralToaster()

const otpApi = useOtpApi(store.mfa)
const isSupported = store.mfa.isSupported('pkotp')

const _otpData = store.mfa.getDataFor<{
    keys: PkiPublicKey[],
    can_add_keys: boolean,
    data_size: number,
    max_size: number
}>('pkotp')
const otpData = refDefault(_otpData, { keys: [], can_add_keys: false, data_size: 0, max_size: 0 })

const keyData = shallowRef<string | undefined>()
const [isOpen, toggleOpen] = useToggle()

const removeKey = async (key: PkiPublicKey) => {
    const { isCanceled } = await reveal({
        title: 'Remove Key',
        text: `Are you sure you want to remove ${key.kid}?`
    });

    if (isCanceled) return
    
    elevatedApiCall(async ({ toaster, password }) => {
        const { getResultOrThrow } = await otpApi.removeKey({ kid: key.kid } as any, { password });
        getResultOrThrow();

        toaster.general.success({
            title: 'Key Removed',
            text: `${key.kid} has been successfully removed`
        })

        store.mfa.refresh();

        return true;
    })
}

const onDisable = async () => {
    const { isCanceled } = await reveal({
        title: 'Are you sure?',
        text: 'This will disable PKI authentication for your account.'
    })
    if (isCanceled) {
        return;
    }

    //Delete pki
    elevatedApiCall(async ({ password }) => {

        //Disable otp
        const { success } = await otpApi.disable({ password });

        if (success) {
            toaster.success({
                title: 'Success',
                text: 'PKI authentication has been disabled.'
            })
        }
        else {
            toaster.error({
                title: 'Error',
                text: 'PKI authentication could not be disabled.'
            })
        }

        //Refresh the status
        store.mfa.refresh()
    });
}

const onAddKey = async () => {

    if (window.crypto.subtle == null) {
        toaster.error({ title: "Your browser does not support PKI authentication." })
        return;
    }

    const jwkKeyData = get(keyData)

    //Validate key data
    if (!jwkKeyData || isEmpty(jwkKeyData)) {
        toaster.error({ title: "Please enter key data" })
        return;
    }

    let jwk: PkiPublicKey & JsonWebKey;
    try {
        //Try to parse as jwk
        jwk = JSON.parse(jwkKeyData)
        if (isEmpty(jwk.use)
            || isEmpty(jwk.kty)
            || isEmpty(jwk.alg)
            || isEmpty(jwk.kid)
            || isEmpty(jwk.x)
            || isEmpty(jwk.y)) {
            throw new Error("Invalid JWK");
        }
    }
    catch (e) {
        //Write error to debug log
        debugLog(e)
        toaster.error({ title: "Invalid JWK", text:"The public key you entered is not a valid JWK" })
        return;
    }

    toggleOpen(false);

    const result = await elevatedApiCall(async ({ toaster, password }) => {

        //init/update the key
        const { getResultOrThrow } = await otpApi.addOrUpdate(jwk, { password });
        const text = getResultOrThrow();

        toaster.general.success({ title: 'Key Added', text })

        return true;
    })

    //Reopen the dialog if the result is not successful
    if (!result) {
        toggleOpen(true);
        return;
    }

    set(keyData, '');
    store.mfa.refresh();
}

</script>

<template>
   
    <div v-if="isSupported" class="">
        <div class="flex flex-row justify-between">
            <h3 class="text-xl font-bold">OTP Keys</h3>
            <div class="">

                <button v-if="otpData.can_add_keys" type="button" class="btn blue me-2"
                    @click.prevent="toggleOpen(true)">
                    <div class="flex flex-row items-center gap-1.5">
                        Add
                    </div>
                </button>
                <button type="button" class="btn red" @click.prevent="onDisable">
                    <div class="flex flex-row items-center gap-1.5">
                        Disable
                    </div>
                </button>
            </div>
        </div>

        <div class="relative mt-4 overflow-x-auto shadow-md sm:rounded">
            <table class="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-2">
                            KeyID
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Algorithm
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Curve
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="key in otpData.keys" :key="key.kid"
                        class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {{ toLower(key.kid) }}
                        </th>
                        <td class="px-4 py-3">
                            {{ key.alg }}
                        </td>
                        <td class="px-4 py-3">
                            {{ key.crv }}
                        </td>
                        <td class="px-4 py-3">
                            <button @click.prevent="removeKey(key)"
                                class="font-medium text-red-600 dark:text-red-500 hover:underline">
                                Remove
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

        </div>
        <div class="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
            <span class="mt-1">Data size: {{ otpData.data_size }}/{{ otpData.max_size }} b</span>
        </div>
        <p class="p-3 text-sm text-gray-500 rtl:text-right dark:text-gray-400">
            You can use these keys to sign in to your account using the PKI authentication method.
        </p>
        <Dialog :open="isOpen" title="Add Key" @cancel="toggleOpen(false)">
            <template #body>
                <div class="p-4">

                    <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Add a single Json Web Key (JWK) encoded public key to your account.
                    </label>

                    <textarea id="add-pki-key" rows="6" v-model="keyData" placeholder="Paste your JWK..."
                        class="block w-full text-sm text-gray-900 border border-gray-300 rounded bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    </textarea>

                    <div class="flex justify-end mt-3 row">
                        <button class="btn blue" @click="onAddKey()">Add Key</button>
                    </div>
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style lang="scss"></style>