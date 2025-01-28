import { type JWTPayload } from "jose";
import type { UserLoginCredential } from "../account/types";
import type { WebMessage } from "../types";
export type MfaMethod = 'totp' | 'fido' | 'pkotp';
export interface IMfaSubmission {
    /**
     * TOTP code submission
     */
    readonly code?: number;
    readonly fido?: any;
}
/**
 * The mfa upgrade message that is signed and sent to the client
 * to complete the mfa upgrade process
 */
export interface IMfaMessage extends JWTPayload {
    /**
     * The supported mfa methods for the user
     */
    readonly capabilities: MfaMethod[];
    /**
     * The time in seconds that the mfa upgrade is valid for
     */
    readonly expires?: number;
}
export interface IMfaFlow {
    /**
     * The mfa method this continuation is for
     */
    readonly type: MfaMethod;
    /**
     * Sumits the mfa message to the server and attempts to complete
     * a login process
     * @param message The mfa submission to send to the server
     * @returns A promise that resolves to a login result
     */
    submit: <T>(message: IMfaSubmission) => Promise<WebMessage<T>>;
}
/**
 * Retuned by the login API to signal an MFA upgrade is
 * required to continue the login process
 */
export interface IMfaContinuation {
    /**
   * The time in seconds that the mfa upgrade is valid for
   */
    readonly expires?: number;
    /**
     * The mfa methods that are supported by the user
     * to continue the login process
     */
    readonly methods: IMfaFlow[];
}
/**
 * Interface for handling mfa upgrade submissions to the server
 */
export interface MfaSumissionHandler {
    /**
     * Submits an mfa upgrade submission to the server
     * @param submission The mfa upgrade submission to send to the server to complete an mfa login
     */
    submit<T>(submission: IMfaSubmission): Promise<WebMessage<T>>;
}
/**
 * Interface for processing mfa messages from the server of a given
 * mfa type
 */
export interface IMfaTypeProcessor {
    readonly type: MfaMethod;
    /**
     * Determines if the current runtime supports login with this method
     * @returns True if the mfa type is supported by the client
     */
    readonly isSupported: () => boolean;
    /**
    * Processes an MFA message payload of the registered mfa type
    * @param payload The mfa message from the server as a string
    * @param onSubmit The submission handler to use to submit the mfa upgrade
    * @returns A promise that resolves to a Login request
    */
    getContinuation: (payload: IMfaMessage, onSubmit: MfaSumissionHandler) => Promise<IMfaFlow>;
}
export interface IMfaLoginManager {
    /**
     * Gets a value that indicates if the given mfa method is supported by the client
     * @param method The mfa method to check for support
     * @returns True if the mfa method is supported by the client
     */
    isSupported(method: MfaMethod): boolean;
    /**
     * Logs a user in with the given username and password, and returns a login result
     * or a mfa flow continuation depending on the login flow
     * @param credential The login credential to for the user (username and password)
     */
    login(credential: UserLoginCredential): Promise<WebMessage | IMfaContinuation>;
}
/**
 * Gets the mfa login handler for the accounts backend
 * @param handlers A list of mfa handlers to register
 * @returns The configured mfa login handler
 */
export declare const useMfaLogin: (handlers: IMfaTypeProcessor[]) => IMfaLoginManager;
