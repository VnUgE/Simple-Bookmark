import 'pinia'
import { computed, type Ref, watch } from 'vue';
import { 
    useMfaApi,
    type MfaMethod, 
    type MfaApi,
    type MfaGetResponse,
    useGeneralToaster
} from '@vnuge/vnlib.browser';
import { useAsyncState } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { find, includes } from 'lodash-es';
import { storeExport } from './index';

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

        const { error } = useGeneralToaster();

        const { state: data, execute } = useAsyncState<MfaGetResponse>(async () => {
            const { rpc_methods } = await store.account.wait();

            if (!loggedIn.value || find(rpc_methods, m => m.method === 'mfa.get') === undefined) {
                return {} as MfaGetResponse
            }

            try{

                //errors are swallowed here
                return await mfaConfig.getData()
            }
            catch(e){
                error({ title: 'MFA Failure', text: "Failed to load MFA settings"});
                return {} as MfaGetResponse
            }
        }, {} as any, { delay: 100, immediate: true })

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

        watch(loggedIn, () => execute());

        return storeExport({
            mfa: {
                ...mfaConfig,
                data,
                isEnabled,
                isSupported,
                getDataFor,
                refresh: execute,
            },
        }) as unknown as MfaSettingsStore
    }
}
