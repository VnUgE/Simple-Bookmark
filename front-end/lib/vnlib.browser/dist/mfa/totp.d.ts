import type { IMfaTypeProcessor } from "./login";
import { type MfaApi } from "./config";
import type { AccountRpcResponse } from "../account/types";
export interface TotpRequestOptions {
    readonly password: string;
}
export interface TotpUpdateResponse {
    secret: string;
    readonly issuer: string;
    readonly algorithm: string;
    readonly digits?: number;
    readonly period?: number;
}
export interface ITotpApi {
    enable(options?: Partial<TotpRequestOptions>): Promise<TotpUpdateResponse>;
    disable(options?: Partial<TotpRequestOptions>): Promise<AccountRpcResponse<string>>;
    verify(code: number, options?: Partial<TotpRequestOptions>): Promise<AccountRpcResponse<void>>;
    updateSecret(options?: Partial<TotpRequestOptions>): Promise<TotpUpdateResponse>;
}
/**
 * Creates a fido api for configuration and management of fido client devices
 * @param endpoint The fido server endpoint
 * @param axiosConfig The optional axios configuration to use
 * @returns An object containing the fido api
 */
export declare const useTotpApi: ({ sendRequest }: Pick<MfaApi, "sendRequest">) => ITotpApi;
/**
 * Gets a pre-configured TOTP mfa flow processor
 * @returns A pre-configured TOTP mfa flow processor
 */
export declare const totpMfaProcessor: () => IMfaTypeProcessor;
