import type { WebMessage } from "../types";
export interface SessionConfig {
    readonly browserIdSize: number;
    readonly signatureAlgorithm: string;
    readonly keyAlgorithm: AlgorithmIdentifier;
    readonly cookiesEnabled: boolean;
    readonly loginCookieName: string;
}
export interface ISessionKeyStore {
    /**
     * Regenerates the credentials and stores them in the key store
     */
    regenerateKeysAsync(): Promise<void>;
    /**
     * Decrypts the server encrypted that conforms to the vnlib protocol
     * @param data The data to encrypt, may be a string or an array buffer
     */
    decryptDataAsync(data: string | ArrayBuffer): Promise<ArrayBuffer>;
    /**
     * Decrypts and hashes the data that conforms to the vnlib protocol
     * @param data The data to decrypt and hash, may be a string or an array buffer
     */
    decryptAndHashAsync(data: string | ArrayBuffer): Promise<string>;
}
/**
 * Represents the current server/client session state
 */
export interface ISession {
    /**
    * The internal session key store
    */
    readonly KeyStore: ISessionKeyStore;
    /**
     * Checks if the current session is a local account. This value
     * may change as the app loads
     */
    isLocalAccount(): Promise<boolean>;
    /**
     * Creates a reactive ref that reflects changes
     * to the login status
     */
    isLoggedIn(): Promise<boolean>;
    /**
     * Adds a change listener to the session
     * @param callback The callback to fire when the session state changes
     */
    addChangeListener(callback: () => void): void;
    /**
     * Updates session credentials from the server response
     * @param response The raw response from the server
     */
    updateCredentials(response: ITokenResponse): Promise<void>;
    /**
     * Computes a one time key for a fetch request security header
     * It is a signed jwt token that is valid for a short period of time
     */
    generateOneTimeToken(path: string): Promise<string | null>;
    /**
     * Clears the session login status and removes all client side
     * session data
     */
    clearLoginState(): void;
    /**
     * Gets the client's security info
     */
    getClientSecInfo(): Promise<ClientCredential>;
    /**
     * Attempts to reconcile internal state typically fired
     * when library configuration changes
     */
    reconcileState(): void;
}
export interface ITokenResponse<T = unknown> extends WebMessage<T> {
    readonly token: string;
}
/**
 * Represents the browser's client credential
 */
export interface ClientCredential {
    /**
     * The browser id of the current client
     */
    readonly browserId: string;
    /**
     * The public key of the current client
     */
    readonly publicKey: string;
}
