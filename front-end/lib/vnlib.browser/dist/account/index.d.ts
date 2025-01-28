import type { AccountApi, AccountRpcApi } from './types';
/**
 * Gets the rpc api for interacting with the user's account/profile
 * login, mfa, and other account related functions
 */
export declare const useAccountRpc: <TMethod extends string>() => AccountRpcApi<TMethod>;
export declare const useAccount: () => AccountApi;
