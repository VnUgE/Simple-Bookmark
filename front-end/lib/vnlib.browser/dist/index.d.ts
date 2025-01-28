/*************************
    EXPORTS
*************************/
export * from './util';
export type { WebMessage, ServerValidationError } from './types';
export * from './mfa/login';
export * from './mfa/pki';
export * from './mfa/config';
export * from './mfa/fido';
export * from './mfa/totp';
export * from './social';
export type * from './session';
export { useSession } from './session';
export * from './app-data';
export { useAxios } from './axios';
export type * from './account/types';
export { useAccount, useAccountRpc } from './account';
export * from './toast';
export * from './helpers/apiCall';
export * from './helpers/autoHeartbeat';
export * from './helpers/confirm';
export * from './helpers/envSize';
export * from './helpers/message';
export * from './helpers/serverObjectBuffer';
export * from './helpers/validation';
export * from './helpers/wait';
export * from './helpers/jrpc';
import { type GlobalConfigUpdate } from './globalState';
export type { GlobalApiConfig } from './globalState';
/**
 * Configures the global api settings for the entire library,
 * may be called at any time, but should be called in the main app component
 * before other stateful components are mounted.
 */
export declare const configureApi: (config: GlobalConfigUpdate) => void;
