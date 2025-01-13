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
import { toRefs, set, watchDebounced, useLocalStorage, refWithControl } from "@vueuse/core";
import { defaults, defer } from "lodash-es";
import { defineStore } from "pinia";
import { shallowRef, watch } from "vue";

export type { DownloadContentType } from './bookmarks'

export const useQuery = <T extends string>(name: string) => {

    const getQuery = (): T | null => {
        const url = new URL(window.location.href);
        return url.searchParams.get(name) as T | null;
    }

    const setQuery = (value: T | null) => {
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
    const value = refWithControl(getQuery());
    watchDebounced(value, (value) => setQuery(value), { debounce: 20 });

    return value;
}

export type TabName = 'bookmarks' | 'profile' | 'settings' | 'login' | 'register';

/**
 * Loads the main store for the application
 */
export const useStore = defineStore('main', () => {

    const session = useSession();

    //MANAGED STATE
    const siteTitle = shallowRef("");
    const setSiteTitle = (title: string) => set(siteTitle, title);

    const activeTab = useQuery<TabName>('tab');
    const loggedIn = refWithControl<boolean>(false)
    const isLocalAccount = refWithControl<boolean>(false)

    //Get shared global state storage
    const mainState = useLocalStorage("vn-state", { autoHeartbeat: false });
    //Set defaults to avoid undefined errors from toRefs
    defaults(mainState.value, { autoHeartbeat: false })
    const { autoHeartbeat } = toRefs(mainState)

    //If not logged in, redirect to login tab
    watch(loggedIn, (li) =>{
        if (li || activeTab.untrackedGet() === 'register'){
            return;
        }

        activeTab.set('login');
    })

    //Setup heartbeat for 5 minutes
    useAutoHeartbeat(shallowRef(5 * 60 * 1000), autoHeartbeat)

    //Reconcile session state when the store loads, the api should have already been configured
    session.reconcileState();

    const updateLoginStatus = () => {
        return Promise.all([
            (async () => {
                const newVal = await session.isLoggedIn();
                const current = loggedIn.peek();
                loggedIn.set(newVal, newVal !== current);
            })(),
            (async () => {
                const isLocal = await session.isLocalAccount();
                const current = isLocalAccount.peek();
                isLocalAccount.set(isLocal, isLocal !== current);
            })()
        ])
    }
    
    //Just a background poll incase the user's login status changes
    setInterval(updateLoginStatus, 1000);
    defer(updateLoginStatus);

    return{
        autoHeartbeat,
        loggedIn,
        isLocalAccount,
        siteTitle,
        setSiteTitle,
        activeTab
    }
})
