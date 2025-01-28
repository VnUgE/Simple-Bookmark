import type { AxiosResponse } from "axios";
import type { Ref } from "vue";
import type { WebMessage } from "../types";
import type { ITokenResponse } from "../session";
/**
 * Represents the user/account server api
 */
export interface User {
    /**
     * A reactive ref to the username of the current user.
     * Its updated on calls to getProfile
     */
    readonly userName: Ref<string | undefined>;
    /**
     * Prepares a login request for the server
     */
    prepareLogin(): Promise<IUserLoginRequest>;
    /**
     * Attempts to log the user out
     */
    logout(): Promise<WebMessage>;
    /**
     * Attempts to log the user in with a possible mfa upgrade result
     * @param userName The username to login with
     * @param password The password to login with
     * @returns A promise that resolves to the login result
     */
    login<T>(userName: string, password: string): Promise<ExtendedLoginResponse<T>>;
    /**
     * Gets the user profile from the server
     */
    getProfile<T extends UserProfile>(): Promise<T>;
    /**
     * Resets the password for the current user
     * @param current the user's current password
     * @param newPass the user's new password
     * @param args any additional arguments to send to the server
     */
    resetPassword(current: string, newPass: string, args: object): Promise<WebMessage>;
    /**
     * Sends a heartbeat to the server to keep the session alive
     * and regenerate credentials as designated by the server.
     */
    heartbeat(): Promise<AxiosResponse>;
}
export type IUser = User;
export interface IUserLoginRequest {
    /**
     * Finalizes a login process with the given response from the server
     * @param response The finalized login response from the server
     */
    finalize(response: ITokenResponse): Promise<void>;
}
export interface UserConfig {
    readonly accountBasePath: string;
}
export interface UserState {
    /**
    * A reactive ref to the username of the current user.
    * Its updated on calls to getProfile
    */
    readonly userName: string | undefined;
}
export interface ExtendedLoginResponse<T> extends WebMessage<T> {
    finalize: (response: ITokenResponse) => Promise<void>;
}
export interface UserProfile {
    readonly email: string | undefined;
}
