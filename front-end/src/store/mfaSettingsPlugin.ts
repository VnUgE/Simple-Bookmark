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

import 'pinia'
import { computed, type Ref, ref, watch } from 'vue';
import { 
    apiCall,
    useMfaApi,
    type MfaMethod, 
    type MfaApi,
    type MfaGetResponse
} from '@vnuge/vnlib.browser';
import { useToggle, set } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { find, includes } from 'lodash-es';

export interface MfaSettingsStore{
    readonly mfa: {
        readonly data: MfaGetResponse
        /**
         * Checks if the given mfa method is enabled for the current user
         * @param type The mfa method to check if it is enabled
         * @returns 
         */
        readonly isEnabled: (type: MfaMethod) => Ref<boolean>
        /**
         * Checks if the server announced that the given mfa method is supported
         * on the server
         * @param type The mfa method to check if it is supported
         * @returns A reactive ref that is true if the method is supported
         */
        readonly isSupported: (type: MfaMethod) => Ref<boolean>
        /**
         * Gets the MFA data slot returned by the server for the given mfa method
         * This data is specific to the mfa method and does not have a fixed schema
         * @param type The mfa method to get the data for
         * @returns A reactive ref that contains the data for the mfa method
         */
        readonly getDataFor: <T>(type: MfaMethod) => Ref<T | undefined>
        /**
         * Refreshes the mfa data from the server
         */
        refresh: () => void
    } & MfaApi
}

declare module 'pinia' {
    export interface PiniaCustomProperties extends MfaSettingsStore {
    }
}

export const mfaSettingsPlugin = (): PiniaPlugin => {

    return ({ store }: PiniaPluginContext): MfaSettingsStore => {

        const { loggedIn } = storeToRefs(store)
        const mfaConfig = useMfaApi()

        const [onRefresh, refresh] = useToggle()

        const data = ref<MfaGetResponse>({} as any)

        const isEnabled = (type: MfaMethod): Ref<boolean> => {
            return computed(() => {
                const m = find(data.value.methods, m => m.type === type)
                return m ? m.enabled : false
            })
        }

        const isSupported = (type: MfaMethod): Ref<boolean> => {
            return computed(() => includes(data.value.supported_methods, type))
        }

        const getDataFor = <T>(type: MfaMethod): Ref<T | undefined> => {
            return computed(() => {
                const m = find(data.value.methods, m => m.type === type)
                return m ? m.data as T : undefined
            })
        }

        watch([loggedIn, onRefresh], ([ li ]) => {
            if(!li){
                set(data, {} as any)
                return
            }

            //load the mfa methods if the user is logged in
            apiCall(async () => data.value = await mfaConfig.getData())
        })
        
        return {
            mfa: {
                ...mfaConfig,
                data,
                isEnabled,
                isSupported,
                getDataFor,
                refresh,
            },
        }
    }
}
