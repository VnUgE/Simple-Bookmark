<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore, TabId } from './store';
import { defineAsyncComponent } from 'vue';
import { apiCall } from '@vnuge/vnlib.browser';
import { isEqual } from 'lodash-es';
import { useDark } from '@vueuse/core';
import SideMenuItem from './components/SideMenuItem.vue';
import BottomMenuItem from './components/BottomMenuItem.vue';
const Bookmarks = defineAsyncComponent(() => import('./components/Bookmarks.vue'));
const Settings = defineAsyncComponent(() => import('./components/Settings.vue'));
const Confirm = defineAsyncComponent(() => import('./components/global/ConfirmPrompt.vue'));
const Alerts = defineAsyncComponent(() => import('./components/Alerts.vue'));
const Login = defineAsyncComponent(() => import('./components/Login.vue'));
const PasswordPrompt = defineAsyncComponent(() => import('./components/global/PasswordPrompt.vue'));

const store = useStore();
const { activeTab, siteTitle, loggedIn, userName } = storeToRefs(store);
const darkMode = useDark()

store.setSiteTitle('Simple Bookmark')

const logout = () => {
  apiCall(async () => {
    const { logout } = await store.socialOauth()
    await logout()
  })
}

const showIf = (tabId: TabId, active: TabId) => isEqual(tabId, active)

</script>

<template>
  <head>
    <title>{{ siteTitle }}</title>
  </head>
  <body>
    <div id="app" class="min-h-screen pb-16 text-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white sm:pb-0">
      
      <div class="relative">
          <div class="absolute z-50 right-10 top-10">
            <Alerts />
          </div>
      </div>

      <Confirm />
      <PasswordPrompt />

      <aside id="logo-sidebar" class="fixed top-0 left-0 z-10 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
          <div class="flex flex-col h-full px-3 py-4 overflow-y-auto bg-white dark:bg-gray-800">
              <div class="flex-auto">
                  <a href="/" class="flex items-center ps-2.5 mb-5">
                      <span class="p-2 mr-2 bg-blue-500 rounded-full">
                          <svg class="w-5 h-5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 14 20">
                              <path d="M13 20a1 1 0 0 1-.64-.231L7 15.3l-5.36 4.469A1 1 0 0 1 0 19V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17a1 1 0 0 1-1 1Z"/>
                          </svg>
                      </span>
                      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">{{ siteTitle }}</span>
                  </a>

                  <ul class="space-y-2 font-medium">
                      <SideMenuItem :disabled="!loggedIn" :tab="TabId.Bookmarks" name="Bookmarks">
                          <template #icon>
                              <path d="M13 20a1 1 0 0 1-.64-.231L7 15.3l-5.36 4.469A1 1 0 0 1 0 19V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17a1 1 0 0 1-1 1Z"/>
                          </template>
                      </SideMenuItem>

                      <SideMenuItem :disabled="!loggedIn" :tab="TabId.Profile" name="Profile">
                          <template #icon>
                              <path d="M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z"/>
                          </template>
                      </SideMenuItem>

                      <SideMenuItem :disabled="!loggedIn" :tab="TabId.Settings" name="Settings">
                          <template #icon>
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.75 4H19M7.75 4a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 4h2.25m13.5 6H19m-2.25 0a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 10h11.25m-4.5 6H19M7.75 16a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 16h2.25"/>
                          </template>
                      </SideMenuItem>

                      <SideMenuItem :tab="TabId.Login" :name="loggedIn ? 'Logout' : 'Login'">
                          <template #icon>
                              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 7.5h11m0 0L8 3.786M12 7.5l-4 3.714M12 1h3c.53 0 1.04.196 1.414.544.375.348.586.82.586 1.313v9.286c0 .492-.21.965-.586 1.313A2.081 2.081 0 0 1 15 14h-3"/>
                          </template>
                      </SideMenuItem>
                  </ul>
                  <ul class="pt-2 mt-2 space-y-2 font-medium border-t dark:border-gray-700">
                    <li v-if="userName" class="text-sm text-center text-wrap">
                        Welcome back 
                        <span class="text-blue-500">
                          {{ userName }}
                        </span>
                    </li>
                  </ul>
              </div>
              <div class="flex flex-row gap-3 pb-3 mx-auto text-sm font-bold text-gray-500 w-fit dark:text-gray-200">
                <button @click="darkMode = false" class="block" :class="{'opacity-50':!darkMode }">Light</button>
                <button @click="darkMode = true" class="block" :class="{'opacity-50':darkMode}">Dark</button>
              </div>
              <div class="">
                <p class="text-xs text-center text-gray-500 dark:text-gray-400">
                  Copyright © Vaughn Nugent<br/>
                  Licensed under the GNU AGPLv3 license.
                </p>
              </div>
        </div>
      </aside>

      <div class="h-full py-6 md:p-6 sm:ml-64">
        <div v-if="showIf(TabId.Bookmarks, activeTab)" class="flex flex-col w-full h-full">
          <Bookmarks />
        </div>

        <div v-if="showIf(TabId.Login, activeTab)" class="flex w-full h-full">
          <Login />
        </div>

        <div v-if="showIf(TabId.Settings, activeTab)" class="flex w-full h-full">
          <Settings />
        </div>
      </div>

      <div class="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 sm:hidden dark:bg-gray-700 dark:border-gray-600">
          <div class="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
            
            <BottomMenuItem :disabled="!loggedIn" :tab="TabId.Bookmarks" name="Bookmarks">
                <template #icon>
                    <path d="M13 20a1 1 0 0 1-.64-.231L7 15.3l-5.36 4.469A1 1 0 0 1 0 19V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17a1 1 0 0 1-1 1Z"/>
                </template>
            </BottomMenuItem>

            <BottomMenuItem :disabled="!loggedIn" :tab="TabId.Profile" name="Profile">
                <template #icon>
                    <path d="M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z"/>
                </template>
            </BottomMenuItem>

            <BottomMenuItem :disabled="!loggedIn" :tab="TabId.Settings" name="Settings">
                <template #icon>
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.75 4H19M7.75 4a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 4h2.25m13.5 6H19m-2.25 0a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 10h11.25m-4.5 6H19M7.75 16a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 16h2.25"/>
                </template>
            </BottomMenuItem>

            <BottomMenuItem :tab="TabId.Login" :name="loggedIn ? 'Logout' : 'Login'">
                <template #icon>
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 7.5h11m0 0L8 3.786M12 7.5l-4 3.714M12 1h3c.53 0 1.04.196 1.414.544.375.348.586.82.586 1.313v9.286c0 .492-.21.965-.586 1.313A2.081 2.081 0 0 1 15 14h-3"/>
                </template>
            </BottomMenuItem>
          
          </div>
      </div>

    </div>
  </body>
</template>