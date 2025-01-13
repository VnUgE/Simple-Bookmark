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
import { computed, watch } from 'vue';
import { 
    type ServerDataBuffer,
    type ServerObjectBuffer,
    type UserProfile,
    type WebMessage,
    apiCall,
    useDataBuffer,
    useAccountRpc,
    useAccount
} from '@vnuge/vnlib.browser';
import { useToggle } from '@vueuse/core';
import { PiniaPlugin, PiniaPluginContext, storeToRefs } from 'pinia'
import { defer } from 'lodash-es';

export interface OAuth2Application {
    readonly Id: string,
    readonly name: string,
    readonly description: string,
    readonly permissions: string[],
    readonly client_id: string,
    readonly Created: Date,
    readonly LastModified: Date,
}

export interface NewAppResponse {
    readonly secret: string
    readonly app: ServerDataBuffer<OAuth2Application, WebMessage<string>>
}

interface ExUserProfile extends UserProfile {
    created: string | Date
}

declare module 'pinia' {
    export interface PiniaCustomProperties {
        userProfile: ServerDataBuffer<ExUserProfile, WebMessage<string>>
        userName: string | undefined
        refreshProfile(): void;
    }
}

type AccProfileRpcMethods = 'profile.set' | 'profile.get'

export const profilePlugin = () :PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { loggedIn } = storeToRefs(store)
        const { getProfile } = useAccount()
        const { exec } = useAccountRpc<AccProfileRpcMethods>()

        const [onRefresh, refreshProfile] = useToggle()

        const updateUserProfile = async (profile: ServerObjectBuffer<ExUserProfile>) => {
            // Apply the buffer to the profile
            const { getResultOrThrow } = await exec('profile.set', profile.buffer)

            //Get the new profile from the server
            const newProfile = await getProfile() as ExUserProfile

            //Apply the new profile to the buffer
            profile.apply(newProfile)

            return getResultOrThrow();
        }

        const userProfile = useDataBuffer({} as any, updateUserProfile)
        const userName = computed(() => userProfile.data.email);

        const loadProfile = async () => {
            //Get the user profile
            const profile = await getProfile() as ExUserProfile
            //Apply the profile to the buffer
            userProfile.apply(profile)
        }

        watch([loggedIn, onRefresh], ([li]) => {
            //If the user is logged in, load the profile buffer
            if (li) {
                apiCall(loadProfile)
            }
        })

        defer(refreshProfile);

        return {
            userProfile,
            refreshProfile,
            userName
        }
    }
}