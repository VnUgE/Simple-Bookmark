<script setup lang="ts">
import { defineAsyncComponent, shallowRef } from 'vue';
import { useStore } from '../../store';
import { formatTimeAgo, set } from '@vueuse/core';
import { OAuth2Application } from '../../store/userProfile';
import { ServerDataBuffer, useDataBuffer } from '@vnuge/vnlib.browser';
const Dialog = defineAsyncComponent(() => import('../global/Dialog.vue'));

const { oauth2 } = useStore();

const editBuffer = shallowRef<ServerDataBuffer<OAuth2Application, void> | undefined>();
const editApp = (app: OAuth2Application) =>{
    //Init new server data buffer to push updates
    const buffer = useDataBuffer(app, ({ buffer }) => oauth2.updateMeta(buffer));
    set(editBuffer, buffer);
}

const cancelEdit = () => set(editBuffer, undefined);

</script>

<template>
    <div class="">
        <div class="flex flex-row justify-between">
            <h3 class="text-xl font-bold">OAuth2 Apps</h3>
            <div class="">
                
                <button type="button" class="btn blue" @click.prevent="">
                    <div class="flex flex-row items-center gap-1.5 ">
                        New
                    </div>
                </button>
   
            </div>
        </div>

        <div class="relative mt-2 overflow-x-auto shadow-md sm:rounded">
            <table class="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-2">
                            Client ID
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Name
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Created
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="app in oauth2.apps" :key="app.Id" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {{ app.client_id }}
                        </th>
                        <td class="px-4 py-3">
                             {{ app.name }}
                        </td>
                        <td class="px-4 py-3">
                            {{ formatTimeAgo(app.Created) }}
                        </td>
                        <td class="px-4 py-3">
                            <button 
                            @click.prevent="editApp(app)"
                            class="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                                Edit
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <Dialog :open="editBuffer!= undefined" title="Edit App" @cancel="cancelEdit">
            <template #body>
                Hello world
            </template>
        </Dialog>
    </div>
</template>

<style lang="scss"></style>