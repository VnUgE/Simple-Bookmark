import { type AxiosRequestConfig } from "axios";
export type SocialServerSetQuery = 'invalid' | 'expired' | 'authorized';
/**
 * A continuation function that is called after a successful logout
 */
export type SocialLogoutContinuation = () => Promise<void>;
export interface SocialLoginApi<T> {
    /**
     * The collection of registred authentication methods
     */
    readonly methods: T[];
    /**
     * Begins an OAuth2 social web authentication flow against the server
     * handling encryption and redirection of the browser
     * @param method The desired method to use for login
     */
    beginLoginFlow(method: T): Promise<void>;
    /**
     * Completes a login flow if authorized, otherwise throws an error
     * with the message from the server
     * @returns A promise that resolves when the login is complete
     */
    completeLogin(): Promise<void>;
    /**
     * Logs out of the current session
     * @returns A promise that resolves to true if the logout could be handled by
     * the current method, otherwise false
     */
    logout(): Promise<boolean>;
    /**
     * Gets the active method for the current session if the
     * user is logged in using a social login method that is defined
     * in the methods collection
     */
    getActiveMethod(): T | undefined;
}
/**
 * A social OAuth portal that defines a usable server
 * enabled authentication method
 */
export interface SocialOAuthPortal {
    readonly id: string;
    readonly login: string;
    readonly logout?: string;
    readonly icon?: string;
}
/**
 * An social OAuth2 authentication method that can be used to
 * authenticate against a server for external connections
 */
export interface OAuthMethod {
    /**
     * The unique id of the method
     */
    readonly id: string;
    /**
     * Optional bas64encoded icon image url for the method
     */
    readonly icon?: string;
    /**
     * Determines if the current flow is active for this method
     */
    isActiveLogin(): boolean;
    /**
     * Begins the login flow for this method
     */
    beginLoginFlow(): Promise<void>;
    /**
     * Completes the login flow for this method
     */
    completeLogin(): Promise<void>;
    /**
     * Logs out of the current session
     */
    logout(): Promise<SocialLogoutContinuation | void>;
}
export interface SocialOauthMethod {
    /**
     * Gets the url to the login endpoint for this method
     */
    readonly id: string;
    /**
     * Optional bas64encoded icon image url for the method
     */
    readonly icon?: string;
    /**
     * The endpoint to submit the authentication request to
     */
    loginUrl(): string;
    /**
     * Called when the login to this method was successful
     */
    onSuccessfulLogin?: () => void;
    /**
     * Called when the logout to this method was successful
     */
    onSuccessfulLogout?: (responseData: unknown) => SocialLogoutContinuation | void;
    /**
    * Gets the data to send to the logout endpoint, if this method
    * is undefined, then the logout will be handled by the normal user logout
    */
    getLogoutData?: () => {
        readonly url: string;
        readonly args: unknown;
    };
}
/**
 * Creates a new social login api for the given methods
 */
export declare const useOauthLogin: <T extends OAuthMethod>(methods: T[]) => SocialLoginApi<T>;
/**
 * Creates a new oauth2 login api for the given methods
 */
export declare const fromSocialConnections: <T extends SocialOauthMethod>(methods: T[], axiosConfig?: Partial<AxiosRequestConfig>) => OAuthMethod[];
/**
 * Adds a default logout function to the social login api that will
 * call the user supplied logout function if the social logout does not
 * have a registered logout method
 */
export declare const useSocialDefaultLogout: <T>(socialOauth: SocialLoginApi<T>, logout: () => Promise<unknown>) => SocialLoginApi<T>;
export declare const fromSocialPortals: (portals: SocialOAuthPortal[]) => SocialOauthMethod[];
export declare const fetchSocialPortals: (portalEndpoint: string, axiosConfig?: Partial<AxiosRequestConfig>) => Promise<SocialOAuthPortal[]>;
