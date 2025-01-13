import 'pinia'
import { MaybeRef } from 'vue';
import {
    useAccount,
    useOauthLogin,
    useSocialDefaultLogout,
    fetchSocialPortals,
    fromSocialPortals,
    fromSocialConnections,
} from '@vnuge/vnlib.browser'
import { get } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { defer } from 'lodash-es';

type SocialMfaPlugin = ReturnType<typeof useOauthLogin>

declare module 'pinia' {
    export interface PiniaCustomProperties {
        socialOauth(): Promise<SocialMfaPlugin>
    }
}

export const socialMfaPlugin = (portalEndpoint?: MaybeRef<string>): PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { } = storeToRefs(store)
        const { logout } = useAccount()

        //Create social login from available portals
        const defaultSocial = useSocialDefaultLogout(
            useOauthLogin([]),
            logout  //fallback to default logout
        );

        const _loadPromise = new Promise<SocialMfaPlugin>((resolve, _) => {

            if (get(portalEndpoint) == null) {
                return resolve(defaultSocial)
            }

            /*
                Try to load social methods from server, if it fails, then we will 
                fall back to default
             */

            defer(async () => {

                try {

                    const portals = await fetchSocialPortals(get(portalEndpoint)!);
                    const social = fromSocialPortals(portals);
                    const methods = fromSocialConnections(social);

                    //Create social login from available portals
                    const login = useOauthLogin(methods);

                    const socialOauth = useSocialDefaultLogout(login, logout);
                    resolve(socialOauth)

                } catch (error) {
                    //Let failure fall back to default
                    resolve(defaultSocial)
                }
            })
        })

        const socialOauth = () => _loadPromise

        return {
            socialOauth,
        }
    }
}