<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { apiCall, useAccount, useWait } from '@vnuge/vnlib.browser'
import { storeToRefs } from 'pinia'
import { useStore } from '../store'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { filter } from 'lodash-es'
import UserPass from './Login/UserPass.vue'
import PkiLogin from './Login/PkiLogin.vue'
const AdminReg = defineAsyncComponent(() => import('./Login/AdminReg.vue'))

const store = useStore();
const { loggedIn, siteTitle } = storeToRefs(store);
const { waiting } = useWait();
const { logout:accountLogout } = useAccount()

const adminRegEnabled = computed(() => store.registation.status?.setup_mode);

const logout = () => apiCall(async () => {
    await accountLogout();
    store.account.refresh();
})

//Determines if otp login is enabled on the server, if it's not we can hide the token tab
const isOtpEnabled = computed(() => filter(store.account.data.rpc_methods, { method: 'otp.login' }).length > 0);

</script>
<template>
    <section id="login-page" class="flex-auto">
        <div class="flex flex-col items-center justify-center px-2 py-8 mx-auto sm:px-6 lg:py-24">
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

                    <div v-if="!loggedIn">
                        <!-- password/username login -->
                        <h1
                            class="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl dark:text-white">
                            {{ adminRegEnabled ? "Create admin account" : "Sign in to your account" }}
                        </h1>

                        <TabGroup class="w-full" as="div">
                            <TabList as="ul"
                                class="flex flex-wrap justify-center -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                                <Tab v-if="adminRegEnabled" as="template" v-slot="{ selected }"
                                    class="cursor-pointer me-2">
                                    <div class="tab group" :class="{ selected }">
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                                        </svg>
                                        Create
                                    </div>
                                </Tab>
                                <Tab as="template" v-slot="{ selected }" class="cursor-pointer me-2">
                                    <div class="tab group" :class="{ selected }">
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                                        </svg>
                                        Email
                                    </div>
                                </Tab>
                                <Tab v-if="isOtpEnabled" as="template" v-slot="{ selected }"
                                    class="cursor-pointer me-2">
                                    <div class="tab group" :class="{ selected }">
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path d="M8 18A18.55 18.55 0 0 1 0 3l8-3 8 3a18.549 18.549 0 0 1-8 15Z" />
                                        </svg>
                                        Token
                                    </div>
                                </Tab>
                            </TabList>
                            <TabPanels class="mt-4" as="div">
                                <TabPanel v-if="adminRegEnabled" :unmount="false">
                                    <AdminReg />
                                </TabPanel>
                                <TabPanel :unmount="false">
                                    <UserPass />
                                </TabPanel>
                                <TabPanel v-if="isOtpEnabled" :unmount="false">
                                    <PkiLogin />
                                </TabPanel>
                            </TabPanels>
                        </TabGroup>

                    </div>

                    <div v-else class="">
                        <h1
                            class="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl dark:text-white">
                            Sign Out
                        </h1>

                        <div class="mt-4">
                            <button :disabled="waiting" @click="logout" class="flex justify-center btn">
                                <span v-if="waiting" class="mx-auto animate-spin">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 15 15">
                                        <path fill="currentColor" fill-rule="evenodd"
                                            d="M8 .5V5H7V.5h1ZM5.146 5.854l-3-3l.708-.708l3 3l-.708.708Zm4-.708l3-3l.708.708l-3 3l-.708-.708Zm.855 1.849L14.5 7l-.002 1l-4.5-.006l.002-1Zm-9.501 0H5v1H.5v-1Zm5.354 2.859l-3 3l-.708-.708l3-3l.708.708Zm6.292 3l-3-3l.708-.708l3 3l-.708.708ZM8 10v4.5H7V10h1Z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <span v-else>
                                    Sign Out
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style lang="scss">
#login-page {
    .tab{
        @apply inline-flex items-center justify-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300;

        svg{
            @apply w-4 h-4 text-gray-400 me-2 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300;
        }

        &.selected{
            @apply text-blue-600 border-b-2 border-blue-600 rounded-t-lg dark:text-blue-500 dark:border-blue-500;

            svg{
                @apply text-blue-600 me-2 dark:text-blue-500;
            }
        }
    }

    button.btn{
        @apply w-full focus:ring-4 focus:outline-none font-medium rounded text-sm px-5 py-2.5 text-center;
        @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800;
    }
}
</style>