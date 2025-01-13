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

import 'pinia'
import { shallowRef, watch, type Ref, computed } from 'vue';
import { type MfaGetResponse, type MfaMethod, type PkiPublicKey, apiCall, useMfaApi } from '@vnuge/vnlib.browser';
import { set, useToggle, refDefault, get } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { defer, find, includes } from 'lodash-es';
import {  } from '@vnuge/vnlib.browser';

export interface PkOtpData{
    keys: PkiPublicKey[],
    can_add_keys: boolean,
    data_size: number,
    max_size: number
}

declare module 'pinia' {
    export interface PiniaCustomProperties {
        mfaData: Readonly<MfaGetResponse | undefined>
        mfaConfig: ReturnType<typeof useMfaApi>
        mfaRefreshMethods: () => void
        isMethodSupported: (method: MfaMethod) => Ref<boolean>
        readonly mfaIsEnabled: (method: MfaMethod) => Ref<boolean>
          /**
         * Gets the MFA data slot returned by the server for the given mfa method
         * This data is specific to the mfa method and does not have a fixed schema
         * @param type The mfa method to get the data for
         * @returns A reactive ref that contains the data for the mfa method
         */
        readonly mfaGetDataFor: <T>(type: MfaMethod) => Ref<T | undefined>

        /**
         * Gets the OTP data for the PKI OTP method
         */
        readonly mfaGetOtpData:() => Ref<PkOtpData | undefined>
    }
}

export const mfaSettingsPlugin = (): PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { loggedIn } = storeToRefs(store)
        const mfaConfig = useMfaApi()
        const [onRefresh, mfaRefreshMethods] = useToggle()

        const _mfaData = shallowRef<MfaGetResponse>();
        const mfaData = refDefault(_mfaData, { supported_methods: [], methods: [] })

        watch([loggedIn, onRefresh], ([ li ]) => {
            if(!li){
                set(_mfaData, undefined)
                return
            }

            //load the mfa methods if the user is logged in
            apiCall(async () => _mfaData.value = await mfaConfig.getData())
        })

        //Initial load when page loads
        defer(mfaRefreshMethods)
        
        const isMethodSupported = (method: MfaMethod) => {
            return computed(() => includes(mfaData.value.supported_methods, method))
        }

        const mfaGetDataFor = <T>(type: MfaMethod): Ref<T | undefined> => {
            return computed(() => {
                const { methods } = get(mfaData)
                const m = find(methods, { type })
                return m ? m.data as T : undefined
            })
        }

        const mfaIsEnabled = (type: MfaMethod): Ref<boolean> => {
            return computed(() => {
                const { methods } = get(mfaData)
                const m = find(methods, { type })
                return m ? m.enabled : false
            })
        }

        const mfaGetOtpData = () => {
            const _otpData = mfaGetDataFor<PkOtpData>('pkotp')
            return refDefault(_otpData, { 
                keys: [], 
                can_add_keys: false, 
                data_size: 0, 
                max_size: 0 
            })
        }

        return{
            mfaRefreshMethods,
            mfaData,
            mfaConfig,
            isMethodSupported,
            mfaIsEnabled,
            mfaGetDataFor,
            mfaGetOtpData
        }
    }
}