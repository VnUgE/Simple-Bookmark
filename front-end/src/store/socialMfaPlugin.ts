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
import { MaybeRef } from 'vue';
import { useSocialOauthLogin, useUser, SocialOAuthPortal, fromPortals, useAxios } from '@vnuge/vnlib.browser'
import { get } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { defer } from 'lodash-es';

type SocialMfaPlugin = ReturnType<typeof useSocialOauthLogin>

declare module 'pinia' {
    export interface PiniaCustomProperties {
        socialOauth(): Promise<SocialMfaPlugin>
    }
}

export const socialMfaPlugin = (portalEndpoint?: MaybeRef<string>): PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { } = storeToRefs(store)
        const { logout } = useUser()

        /**
         * Override the logout function to default to a social logout,
         * if the social logout fails, then we will logout the user
         */
        const setLogoutMethod = (socialOauth: SocialMfaPlugin) => {
            const logoutFunc = socialOauth.logout;

            (socialOauth as any).logout = async () => {
                if (await logoutFunc() === false) {
                    await logout()
                }
            }
        }

        const _loadPromise = new Promise<SocialMfaPlugin>((resolve, reject) => {

            if(get(portalEndpoint) == null) {
                const socialOauth = useSocialOauthLogin([])
                setLogoutMethod(socialOauth)
                return resolve(socialOauth)
            }

            defer(async () => {
                try {
                    //Get axios instance
                    const axios = useAxios(null)

                    //Get all enabled portals
                    const { data } = await axios.get<SocialOAuthPortal[]>(get(portalEndpoint)!);
                    //Setup social providers from server portals
                    const socialOauth = useSocialOauthLogin(fromPortals(data));
                    setLogoutMethod(socialOauth);

                    resolve(socialOauth)

                } catch (error) {
                    reject(error)
                }
            })
        })

        const socialOauth = () => _loadPromise

        return {
            socialOauth,
        }
    }
}