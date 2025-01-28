import { type MaybeRef } from 'vue';
import { type AxiosRequestConfig, type Axios } from 'axios';
import type { IErrorNotifier, CombinedToaster } from '../toast';
export interface IApiHandle<T> {
    /**
     * Called to get the object to pass to apiCall is invoked
     */
    getCallbackObject(): T;
    /**
     * Called to get the notifier to use for the api call
     */
    getNotifier(): IErrorNotifier;
    /**
     * Called to set the waiting flag
     */
    setWaiting: (waiting: boolean) => void;
}
export interface IApiPassThrough {
    readonly axios: Axios;
    readonly toaster: CombinedToaster;
}
export interface IElevatedCallPassThrough extends IApiPassThrough {
    readonly password: string;
}
export interface ApiCall<T> {
    <TR>(callback: (data: T) => Promise<TR | undefined>): Promise<TR | undefined>;
}
/**
 * Provides a wrapper method for making remote api calls to a server
 * while capturing context and errors and common api arguments.
 * @returns {Object} The api call function object {apiCall: Promise }
 */
export declare const useApiCall: (notifier: MaybeRef<IErrorNotifier>, axConfig?: AxiosRequestConfig | undefined | null) => {
    apiCall: ApiCall<IApiPassThrough>;
};
/**
 * Provides a wrapper method for making remote api calls to a server
 * while capturing context and errors and common api arguments.
 * @param {*} asyncFunc The method to call within api request context
 * @returns A promise that resolves to the result of the async function
 */
export declare const apiCall: ApiCall<IApiPassThrough>;
/**
 * Gets the shared password prompt object and the elevated api call method handler
 * to allow for elevated api calls that require a password.
 * @returns {Object} The password prompt configuration object, and the elevated api call method
 */
export declare const usePassConfirm: () => {
    elevatedApiCall: <T>(callback: (api: IElevatedCallPassThrough) => Promise<T>) => Promise<T | undefined>;
    isRevealed: import("vue").ComputedRef<boolean>;
    reveal: (data?: any) => Promise<import("@vueuse/core").UseConfirmDialogRevealResult<any, any>>;
    confirm: (data?: any) => void;
    cancel: (data?: any) => void;
    onReveal: import("@vueuse/shared").EventHookOn<any>;
    onConfirm: import("@vueuse/shared").EventHookOn<any>;
    onCancel: import("@vueuse/shared").EventHookOn<any>;
};
