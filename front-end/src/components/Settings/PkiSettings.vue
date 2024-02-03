<script setup lang="ts">
import { defineAsyncComponent, shallowRef } from 'vue';
import { useStore } from '../../store';
import { get, set } from '@vueuse/core';
import { PkiPublicKey, apiCall, debugLog, useConfirm, useGeneralToaster } from '@vnuge/vnlib.browser';
import { storeToRefs } from 'pinia';
import { isEmpty, toLower } from 'lodash-es';
const Dialog = defineAsyncComponent(() => import('../global/Dialog.vue'));

const store = useStore();
const { pkiPublicKeys } = storeToRefs(store);
const { reveal } = useConfirm()
const toaster = useGeneralToaster()

const keyData = shallowRef<string | undefined>()
const showAddKeyDialog = () => set(keyData, '');
const hideAddKeyDialog = () => set(keyData, undefined);

const removeKey = async (key: PkiPublicKey) => {    
    const { isCanceled } = await reveal({
        title: 'Remove Key',
        text: `Are you sure you want to remove ${key.kid}?`
    });

    if (isCanceled) return
    
    apiCall(async ({ toaster }) => {
        //const { getResultOrThrow } = await store.pkiConfig.removeKey(key.kid);
        //await getResultOrThrow();

        toaster.general.success({
            title: 'Key Removed',
            text: `${key.kid} has been successfully removed`
        })
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
    await apiCall(async () => {

        //Disable pki
        //TODO: require password or some upgrade to disable
        const { success } = await store.pkiConfig.disable();

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
        store.mfaRefreshMethods()
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

    //Send to server
    await apiCall(async () => {

        //init/update the key
        //TODO: require password or some upgrade to disable
        const { getResultOrThrow } = await store.pkiConfig.addOrUpdate(jwk);
        const result = getResultOrThrow();

        toaster.success({
            title: 'Success',
            text: result
        })

        hideAddKeyDialog()
    })
}

</script>

<template>
    <div class="">
        <div class="flex flex-row justify-between">
            <h3 class="text-xl font-bold">Authentication Keys</h3>
            <div class="">
                
                <button type="button" class="btn blue me-2" @click.prevent="showAddKeyDialog">
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
                    <tr v-for="key in pkiPublicKeys" :key="key.kid"
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
        <p class="p-3 text-sm text-gray-500 rtl:text-right dark:text-gray-400">
            Above are your account authentication keys. You can use these keys to sign in to your account using the PKI
            authentication method.
        </p>
        <Dialog :open="keyData != undefined" title="Add Key" @cancel="hideAddKeyDialog">
            <template #body>
               <div class="p-4">

                    <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Add a single Json Web Key (JWK) encoded public key to your account.
                    </label>
                
                    <textarea 
                        id="add-pki-key" 
                        rows="6" 
                        v-model="keyData"
                        placeholder="Paste your JWK..."
                        class="block w-full text-sm text-gray-900 border border-gray-300 rounded bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
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