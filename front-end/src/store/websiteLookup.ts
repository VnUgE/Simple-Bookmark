
import 'pinia'
import { MaybeRef, Ref, shallowRef, watch } from 'vue';
import { WebMessage, apiCall, useAxios } from '@vnuge/vnlib.browser'
import { get, set } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { defer, filter, isEmpty, noop } from 'lodash-es';

export interface WebsiteLookupResult {
    readonly title: string | undefined,
    readonly description: string | undefined,
    keywords: string[] | undefined,
}

export interface LookupApi{
    isSupported: Ref<boolean>,
    timeout: Ref<number>,
    execLookup(url:string): Promise<WebsiteLookupResult>
}

declare module 'pinia' {
    export interface PiniaCustomProperties {
       websiteLookup:{
            isSupported: boolean,
           execLookup(url: string): Promise<WebsiteLookupResult>
       }
    }
}

const urlToBase64UrlEncoded = (url: string) => {
    return btoa(url)
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/\./g, '=') //Fix padding
}

export const siteLookupPlugin = (lookupEndpoint: MaybeRef<string>, to: number): PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { loggedIn } = storeToRefs(store)
        const axios = useAxios(null)

        const isSupported = shallowRef(false)
        const timeout = shallowRef(to)
     
        const checkIsSupported = () => {
            return apiCall(async () => {
                //Execute test with the 'support' query parameter
                const { data } = await axios.get<WebMessage>(`${get(lookupEndpoint)}?support`)
                set(isSupported, data.success)
            });
        }

        const execLookup = async (url:string) => {
            const base64Url = urlToBase64UrlEncoded(url)

            //Execute test with the 'support' query parameter
            const { data } = await axios.get<WebMessage<WebsiteLookupResult>>(`${get(lookupEndpoint)}?timeout=${get(timeout)}&url=${base64Url}`)
            const lookup = data.getResultOrThrow();
            lookup.keywords = filter(lookup.keywords, (k) => !isEmpty(k))
            return lookup
        }

        //If login status changes, recheck support
        watch([loggedIn], ([li]) => li ? defer(checkIsSupported) : noop(), { immediate: true })

        return {
            websiteLookup: {
                isSupported,
                execLookup,
                timeout
            } as LookupApi
        } as any
    }
}