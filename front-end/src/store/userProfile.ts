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
import { MaybeRef, watch } from 'vue';
import { ServerDataBuffer, ServerObjectBuffer, UserProfile, WebMessage, apiCall, useAxios, useDataBuffer, useUser } from '@vnuge/vnlib.browser';
import { get, useToggle } from '@vueuse/core';
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

export const profilePlugin = (accountsUrl:MaybeRef<string>) :PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { loggedIn } = storeToRefs(store)
        const { getProfile, userName } = useUser()
        const axios = useAxios(null)

        const [onRefresh, refreshProfile] = useToggle()

        const updateUserProfile = async (profile: ServerObjectBuffer<ExUserProfile>) => {
            // Apply the buffer to the profile
            const { data } = await axios.post<WebMessage<string>>(get(accountsUrl), profile.buffer)

            //Get the new profile from the server
            const newProfile = await getProfile() as ExUserProfile

            //Apply the new profile to the buffer
            profile.apply(newProfile)

            return data;
        }

        const userProfile = useDataBuffer({} as any, updateUserProfile)

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