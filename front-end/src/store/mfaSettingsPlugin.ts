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
import { MaybeRef, shallowRef, watch } from 'vue';
import { MfaMethod, PkiPublicKey, apiCall, useMfaConfig, usePkiConfig, usePkiAuth } from '@vnuge/vnlib.browser';
import { useToggle, get } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { defer, includes } from 'lodash-es';

declare module 'pinia' {
    export interface PiniaCustomProperties {
        mfaEndabledMethods: MfaMethod[]
        mfaConfig: ReturnType<typeof useMfaConfig>
        pkiConfig: ReturnType<typeof usePkiConfig>
        pkiAuth: ReturnType<typeof usePkiAuth>
        pkiPublicKeys: PkiPublicKey[]
        mfaRefreshMethods: () => void
    }
}

export const mfaSettingsPlugin = (mfaEndpoint: MaybeRef<string>, pkiEndpoint?:MaybeRef<string>): PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { loggedIn } = storeToRefs(store)
        const mfaConfig = useMfaConfig(mfaEndpoint)
        const pkiConfig = usePkiConfig(pkiEndpoint || '/')
        const pkiAuth = usePkiAuth(pkiEndpoint || '/')
        const [onRefresh, mfaRefreshMethods] = useToggle()

        const mfaEndabledMethods = shallowRef<MfaMethod[]>([])
        const pkiPublicKeys = shallowRef<PkiPublicKey[]>([])

        watch([loggedIn, onRefresh], ([ li ]) => {
            if(!li){
                mfaEndabledMethods.value = []
                return
            }

            //load the mfa methods if the user is logged in
            apiCall(async () => mfaEndabledMethods.value = await mfaConfig.getMethods())
        })

        //Watch for changes to mfa methods (refresh) and update the pki keys
        watch([mfaEndabledMethods], ([ methods ]) => {
            if(!includes(methods, 'pki' as MfaMethod) || !get(pkiEndpoint)){
                pkiPublicKeys.value = []
                return
            }

            //only load the pki keys if pki is enabled on the server
            apiCall(async () => pkiPublicKeys.value = await pkiConfig.getAllKeys())
        })

        //Initial load when page loads
        defer(mfaRefreshMethods)

        return{
            mfaRefreshMethods,
            mfaEndabledMethods,
            mfaConfig,
            pkiConfig,
            pkiAuth,
            pkiPublicKeys
        }
    }
}