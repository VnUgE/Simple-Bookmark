import type { WebMessage } from '../types';
import type { AccountRpcResponse } from "../account/types";
import type { MfaApi } from "./config";
/**
 * Represents the server api for loging in with a signed OTP
 */
export interface PkOtpLogin {
    /**
     * Authenticates a user with a signed JWT one time password
     * @param pkiJwt The user input JWT signed one time password for authentication
     * @returns A promise that resolves to the login result
     */
    login<T>(pkiJwt: string): Promise<WebMessage<T>>;
}
export type PkiLogin = PkOtpLogin;
export interface PkiPublicKey {
    readonly kid: string;
    readonly alg: string;
    readonly kty: string;
    readonly crv: string;
    readonly x: string;
    readonly y: string;
}
export interface IOtpRequestOptions extends Record<string, any> {
    readonly password: string;
}
/**
 * A base, non-mfa integrated PKI endpoint adapter interface
 */
export interface OtpApi {
    /**
    * Initializes or updates the pki method for the current user
    * @param publicKey The user's public key to initialize or update the pki method
    * @param options Optional extended configuration for the pki method. Gets passed to the server
    */
    addOrUpdate(publicKey: PkiPublicKey, options?: Partial<IOtpRequestOptions>): Promise<AccountRpcResponse<string>>;
    /**
     * Disables the pki method for the current user and passes the given options to the server
     */
    disable(options?: Partial<IOtpRequestOptions>): Promise<AccountRpcResponse<string>>;
    /**
     * Removes a single public key by it's id for the current user
     */
    removeKey(key: PkiPublicKey, options?: Partial<IOtpRequestOptions>): Promise<AccountRpcResponse<string>>;
}
/**
 * Creates a pki login api that allows for authentication with a signed JWT
 */
export declare const useOtpAuth: () => PkOtpLogin;
/**
 * Gets the api for interacting with the the user's pki configuration
 * @param pkiEndpoint The server pki endpoint relative to the base url
 * @returns An object containing the pki api
 */
export declare const useOtpApi: ({ sendRequest }: Pick<MfaApi, "sendRequest">) => OtpApi;
