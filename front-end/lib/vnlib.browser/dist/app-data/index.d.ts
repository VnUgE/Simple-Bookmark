import { MaybeRef, type StorageLikeAsync } from '@vueuse/core';
import type { Axios } from 'axios';
export interface AppDataGetOptions {
    /**
     * A value indicating if the request should not use the cache
     */
    readonly noCache?: boolean;
}
export interface AppDataSetOptions {
    /**
     * A value indicating if the request should wait for the data to be written to the store
     */
    readonly wait?: boolean;
}
export interface UserAppDataApi {
    /**
     * Gets data from the app-data server
     * @param scope The scope of the data to get from the store
     * @param options The options to use when getting the data
     * @returns A promise that resolves to the data or undefined if the data does not exist
     */
    get<T>(scope: string, options?: AppDataGetOptions): Promise<T | undefined>;
    /**
     * Sets arbitrary data in the app-data server
     * @param scope The scope of the data to set in the store
     * @param data The data to set in the store
     * @param options The options to use when setting the data
     */
    set<T>(scope: string, data: T, options?: AppDataSetOptions): Promise<void>;
    /**
     * Completely removes data from the app-data server
     * @param scope The scope of the data to remove from the store
     */
    remove(scope: string): Promise<void>;
}
export interface ScopedUserAppDataApi {
    /**
     * Gets data from the app-data server for the configured scope
     * @param options The options to use when getting the data
     * @returns A promise that resolves to the data or undefined if the data does not exist
     */
    get<T>(options: AppDataGetOptions): Promise<T | undefined>;
    /**
     * Sets arbitrary data in the app-data server for the configured scope
     * @param data The data to set in the store
     * @param options The options to use when setting the data
     * @returns A promise that resolves when the data has been written to the store
     */
    set<T>(data: T, options: AppDataSetOptions): Promise<void>;
    /**
     * Completely removes data from the app-data server for the configured scope
     * @returns A promise that resolves when the data has been removed from the store
     */
    remove(): Promise<void>;
}
/**
 * Creates an AppData API for the given endpoint
 * @param endpoint The endpoint to use
 * @param axios The optional axios instance to use for requests
 * @returns The AppData API
 */
export declare const useAppDataApi: (endpoint: MaybeRef<string>, axios?: Axios) => UserAppDataApi;
/**
 * Creates an AppData API that uses at constant scope for all requests
 * @param endpoint The app-data endpoint to use
 * @param scope The data request scope
 * @param axios The optional axios instance to use for requests
 */
export declare const useScopedAppDataApi: (endpoint: MaybeRef<string>, scope: MaybeRef<string>, axios?: Axios) => ScopedUserAppDataApi;
/**
 * Creates a StorageLikeAsync object that uses the given UserAppDataApi
 * @param api The UserAppDataApi instance to use
 * @returns The StorageLikeAsync object
 */
export declare const useAppDataAsyncStorage: (api: UserAppDataApi) => StorageLikeAsync;
