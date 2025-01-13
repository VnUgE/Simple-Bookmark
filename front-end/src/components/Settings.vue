<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { useStore } from '../store';
import { defineAsyncComponent } from 'vue';
import PasswordReset from './Settings/PasswordReset.vue';
import PkiSettings from './Settings/PkiSettings.vue';
import TotpSettings from './Settings/TotpSettings.vue';
import Bookmarks from './Settings/Bookmarks.vue';
const Registation = defineAsyncComponent(() => import('./Settings/Registation.vue'));

const store = useStore();
const darkMode = useDark();

</script>

<template>
    <div class="w-full sm:pt-10 lg:pl-[15%] sm:pl-4 px-4">
        <h2 class="text-2xl font-bold">Settings</h2>
        <div class="flex flex-col w-full max-w-3xl gap-10 mt-3">

            <div class="mb-6">
                <h3 class="text-xl font-bold">
                    General
                </h3>
                <div class="grid grid-cols-1 gap-3 p-4">
                    <div class="">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" class="sr-only peer" v-model="darkMode">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span class="text-sm font-medium text-gray-900 ms-3 dark:text-gray-300">Dark mode</span>
                        </label>
                    </div>
                    <div class="">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" class="sr-only peer" v-model="store.autoHeartbeat">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span class="text-sm font-medium text-gray-900 ms-3 dark:text-gray-300">Stay signed in</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h3 class="text-xl font-bold">Boomarks</h3>

                <div class="relative mt-4">
                    <Bookmarks />
                </div>
            </div>

            <PasswordReset />

            <div class="mb-8">
                <h3 class="text-xl font-bold">Multi Factor Auth</h3>

                <div class="relative mt-4 py-2.5">
                    <TotpSettings />
                </div>
            </div>

            <PkiSettings />

            <div v-if="store.registation.status?.can_invite" class="mt-6 mb-10">
                <Registation />
            </div>

        </div>
    </div>
</template>

<style lang="scss">

</style>