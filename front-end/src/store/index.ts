// Copyright (C) 2024 Vaughn Nugent
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useSession, useAutoHeartbeat } from "@vnuge/vnlib.browser";
import { toRefs, set, watchDebounced, useLocalStorage } from "@vueuse/core";
import { noop, toSafeInteger, toString, defaults } from "lodash-es";
import { defineStore } from "pinia";
import { computed, shallowRef, watch } from "vue";

export const useQuery = (name: string) => {

    const getQuery = () => {
        const url = new URL(window.location.href);
        return url.searchParams.get(name) as string | null | undefined;
    }

    const setQuery = (value: string | null | undefined) => {
        const url = new URL(window.location.href);

        if(value){
            url.searchParams.set(name, value);
           
        }
        else{
            url.searchParams.delete(name);
        }

        window.history.replaceState({}, '', url.toString());
    }

    //configure reactive state
    const value = shallowRef(getQuery());
    watchDebounced(value, (value) => setQuery(value), { debounce: 20 });

    return value;
}

export enum TabId{
    Bookmarks,
    Profile,
    Settings,
    Login
}

/**
 * Loads the main store for the application
 */
export const useStore = defineStore('main', () => {

    const { loggedIn, isLocalAccount } = useSession();

    //MANAGED STATE
    const siteTitle = shallowRef("");
    const setSiteTitle = (title: string) => set(siteTitle, title);

    //Get shared global state storage
    const mainState = useLocalStorage("vn-state", { autoHeartbeat: false });
    //Set defaults to avoid undefined errors from toRefs
    defaults(mainState.value, { autoHeartbeat: false })
    const { autoHeartbeat } = toRefs(mainState)

    const tab = useQuery('tab');
    const activeTab = computed<TabId>({
        get: () => tab.value ? toSafeInteger(tab.value) : TabId.Bookmarks,
        set: (value) => tab.value = toString(value)
    })

    //If not logged in, redirect to login tab
    watch(loggedIn, (loggedIn) => loggedIn ? noop() : set(activeTab, TabId.Login), { immediate: true })

    //Setup heartbeat for 5 minutes
    useAutoHeartbeat(shallowRef(5 * 60 * 1000), autoHeartbeat)

    return{
        autoHeartbeat,
        loggedIn,
        isLocalAccount,
        siteTitle,
        setSiteTitle,
        activeTab
    }
})
