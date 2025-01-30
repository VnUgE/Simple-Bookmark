// Copyright (C) 2025 Vaughn Nugent
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
import { toRefs, set, watchDebounced, useLocalStorage, refWithControl, type DeepMaybeRef } from "@vueuse/core";
import { defaultsDeep } from "lodash-es";
import { defineStore } from "pinia";
import { shallowRef, type UnwrapNestedRefs } from "vue";

export type { DownloadContentType } from './bookmarks'

export const useQuery = <T extends string>(name: string) => {

    let onPop = false;

    const getQuery = (): T | null => {
        const url = new URL(window.location.href);
        return url.searchParams.get(name) as T | null;
    }

    const setQuery = (value: T | null) => {
        if(onPop){
            onPop = false;
            return;
        }
        
        const url = new URL(window.location.href);

        if(value){
            url.searchParams.set(name, value);
        }
        else{
            url.searchParams.delete(name);
        }

        window.history.pushState({}, '', url.toString());
    }

    //configure reactive state
    const value = refWithControl(getQuery());
    watchDebounced(value, (value) => setQuery(value), { debounce: 20 });

    //user may use back/forward buttons so watch history and update the query
    window.addEventListener('popstate', () => {
        onPop = true;
        value.set(getQuery());
    });

    return value;
}

export type TabName = 'bookmarks' | 'profile' | 'settings' | 'login' | 'register';

export const storeExport = <T>(val: DeepMaybeRef<T>): UnwrapNestedRefs<T> => val as UnwrapNestedRefs<T>;

type GlobalState = { autoHeartbeat: boolean, theme: string, loggedIn: boolean, userName: string | undefined };
const defaultState: GlobalState = { autoHeartbeat: false, theme: '', loggedIn: false, userName: undefined };

/**
 * Loads the main store for the application
 */
export const useStore = defineStore('main', () => {

    //MANAGED STATE
    const siteTitle = shallowRef("");
    const setSiteTitle = (title: string) => set(siteTitle, title);

    const activeTab = useQuery<TabName>('tab');

    //Get shared global state storage
    const mainState = useLocalStorage<GlobalState | undefined>("vn-state", defaultState);
    defaultsDeep(mainState.value, defaultState);
    const stateRefs = toRefs<GlobalState>(mainState as any);

    //Setup heartbeat for 5 minutes
    useAutoHeartbeat(shallowRef(5 * 60 * 1000), stateRefs.autoHeartbeat)
    
    return {
        ...stateRefs,
        siteTitle,
        setSiteTitle,
        activeTab
    }
})
