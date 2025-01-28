import { type StorageLikeAsync } from "@vueuse/core";
import type { SessionConfig } from "../session";
import type { AccountRpcApiConfig } from "../account/types";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { ReadonlyManualRef } from "../storage";
export interface GlobalSessionConfig extends SessionConfig {
}
export interface GlobalAxiosConfig extends AxiosRequestConfig {
    tokenHeader: string;
    configureAxios?: (axios: AxiosInstance) => AxiosInstance;
}
export interface GlobalApiConfig {
    readonly session: GlobalSessionConfig;
    readonly axios: GlobalAxiosConfig;
    readonly account: AccountRpcApiConfig;
    readonly storage: StorageLikeAsync;
}
export interface GlobalConfigUpdate {
    readonly session?: Partial<GlobalSessionConfig>;
    readonly axios?: Partial<GlobalAxiosConfig>;
    readonly account?: Partial<AccountRpcApiConfig>;
    readonly storage?: StorageLikeAsync;
}
export type StorageKey = '_vn-session' | '_vn-keys';
export declare const getGlobalStateInternal: () => ReadonlyManualRef<GlobalApiConfig>;
/**
 * Sets the global api configuration
 * @param config The new configuration
 */
export declare const setApiConfigInternal: (config: GlobalConfigUpdate) => void;
