import 'pinia'
import { computed, type Ref } from 'vue';
import { 
    type AccountRpcGetResult,
    type AccountRpcMethod,
    useAccountRpc
} from '@vnuge/vnlib.browser';
import { get, syncRef, useAsyncState } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { defaultsDeep, filter } from 'lodash-es';
import { storeExport } from './index';

export interface AccountStateStore{
    readonly account: {
        readonly data: AccountRpcGetResult
        readonly refresh: () => void
        readonly isMethodSupported: (type: string) => Ref<boolean>
        readonly getPropertyData: <T>(name: string, defaultValue: T) => Ref<T>
        readonly wait: () => Promise<AccountRpcGetResult>
    }
}

declare module 'pinia' {
    export interface PiniaCustomProperties extends AccountStateStore {}
}

export const accountStatePlugin = (): PiniaPlugin => {

    const accRpc = useAccountRpc();

    return ({ store }: PiniaPluginContext): AccountStateStore => {

        const { loggedIn } = storeToRefs(store)

        const accountRpcState = useAsyncState(accRpc.getData, { 
            http_methods: [], 
            rpc_methods: [], 
            properties: [], 
            accept_content_type: '' ,
            status: { 
                authenticated: false, 
                is_local_account: false 
            }
        }, { delay: 100, immediate: true })

        //This plugin is authoritatively setting the value of loggedIn
        syncRef(loggedIn, computed(() => accountRpcState.isReady && accountRpcState.state.value.status.authenticated), { direction: 'rtl'});

        const isMethodSupported = (type: string): Ref<boolean> => {
            return computed(() => {
                const { rpc_methods } = accountRpcState.state.value;
                return filter(rpc_methods as AccountRpcMethod[], { method: type }).length > 0;
            })
        }

        const getPropertyData = <T>(name: string, defaultVal: T): Ref<T> => {
            return computed(() => {
                const { properties } = get(accountRpcState.state);
                const [ val ] = filter(properties, { type: name });
                return defaultsDeep(val, defaultVal);
            })
        }

        const wait = async () => {
            const { state } = await accountRpcState;
            return state.value;
        }

        return storeExport<AccountStateStore>({
            account: {
                data: accountRpcState.state,
                refresh: accountRpcState.execute,
                getPropertyData,
                wait,
                isMethodSupported
            }
        })
    }
}
