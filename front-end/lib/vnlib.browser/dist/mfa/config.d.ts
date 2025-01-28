import type { MfaMethod } from "./login";
import { AccountRpcResponse } from '../account/types';
export type UserArg = object;
export interface MfaMethodResponse {
    readonly type: MfaMethod;
    readonly enabled: boolean;
    readonly data: any;
}
export interface MfaGetResponse {
    readonly supported_methods: MfaMethod[];
    readonly methods: MfaMethodResponse[];
}
export interface MfaRequestJson extends Record<string, any> {
    readonly type: MfaMethod;
    readonly action: string;
    readonly password?: string;
}
/**
 * Represents the server api for interacting with the user's
 * mfa configuration
 */
export interface MfaApi {
    /**
     * Determines if the mfa rpc api is available
     * and enabled on the server
     */
    isEnabled(): Promise<boolean>;
    /**
     * Gets the mfa data for the current user
     */
    getData(): Promise<MfaGetResponse>;
    /**
     * Sends an mfa rpc request to the server
     * @param request The rpc request to send
     * @returns A promise that resolves to the server response
     */
    sendRequest<T>(request: MfaRequestJson): Promise<AccountRpcResponse<T>>;
}
/**
 * Gets the api for interacting with the the user's mfa configuration
 * @param mfaEndpoint The server mfa endpoint relative to the base url
 * @returns An object containing the mfa api
 */
export declare const useMfaApi: () => MfaApi;
