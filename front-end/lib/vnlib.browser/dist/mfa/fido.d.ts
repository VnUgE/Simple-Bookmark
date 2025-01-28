import type { IMfaFlow, IMfaTypeProcessor } from "./login";
import type { RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import type { WebMessage } from "../types";
import { type MfaApi } from "./config";
import type { AccountRpcResponse } from "../account/types";
export type IFidoServerOptions = PublicKeyCredentialCreationOptionsJSON;
export interface IFidoMfaFlow extends IMfaFlow {
    readonly authenticate: <T>(useAutoFill: boolean, options?: Partial<IFidoRequestOptions>) => Promise<WebMessage<T>>;
}
export interface IFidoRequestOptions extends Record<string, any> {
    readonly password: string;
}
export interface IFidoDevice {
    readonly n: string;
    readonly id: string;
    readonly alg: number;
}
export interface IFidoApi {
    isSupported(): boolean;
    /**
     * Gets fido credential options from the server for a currently logged-in user
     * @returns A promise that resolves to the server options for the FIDO API
     */
    beginRegistration: (options?: Partial<IFidoRequestOptions>) => Promise<PublicKeyCredentialCreationOptionsJSON>;
    /**
     * Creates a new credential for the currently logged-in user
     * @param credential The credential to create
     * @returns A promise that resolves to a web message
     */
    registerCredential: (credential: RegistrationResponseJSON, commonName: string) => Promise<AccountRpcResponse<string>>;
    /**
     * Registers the default device for the currently logged-in user
     * @returns A promise that resolves to a web message status of the operation
     */
    registerDefaultDevice: (commonName: string, options?: Partial<IFidoRequestOptions>) => Promise<AccountRpcResponse<string>>;
    /**
     * Disables a device for the currently logged-in user.
     * May require a password to be passed in the options
     * @param device The device descriptor to disable
     * @param options The options to pass to the server
     * @returns A promise that resolves to a web message status of the operation
     */
    disableDevice: (device: IFidoDevice, options?: Partial<IFidoRequestOptions>) => Promise<AccountRpcResponse<string>>;
    /**
     * Disables all devices for the currently logged-in user.
     * May require a password to be passed in the options
     * @param options The options to pass to the server
     * @returns A promise that resolves to a web message status of the operation
     */
    disableAllDevices: (options?: Partial<IFidoRequestOptions>) => Promise<AccountRpcResponse<string>>;
}
/**
 * Creates a fido api for configuration and management of fido client devices
 * @param sendRequest The function to send a request to the server
 * @returns An object containing the fido api
 */
export declare const useFidoApi: ({ sendRequest }: Pick<MfaApi, "sendRequest">) => IFidoApi;
/**
 * Enables fido as a supported multi-factor authentication method
 * @returns A mfa login processor for fido multi-factor
 */
export declare const fidoMfaProcessor: () => IMfaTypeProcessor;
