// Copyright (c) 2024 Vaughn Nugent
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
/*************************
    EXPORTS
*************************/
//Export the all util
export * from './util';
//Mfa exports
export * from './mfa/login';
export * from './mfa/pki';
export * from './mfa/config';
export * from './mfa/fido';
export * from './mfa/totp';
//Social exports
export * from './social';
export { useSession } from './session';
//App-data
export * from './app-data';
//Axios exports
export { useAxios } from './axios';
export { useAccount, useAccountRpc } from './account';
//Export toast apis directly
export * from './toast';
//Export helpers
export * from './helpers/apiCall';
export * from './helpers/autoHeartbeat';
export * from './helpers/confirm';
export * from './helpers/envSize';
export * from './helpers/message';
export * from './helpers/serverObjectBuffer';
export * from './helpers/validation';
export * from './helpers/wait';
export * from './helpers/jrpc';
/*************************
    SETUP/LOCALS
*************************/
import { cloneDeep } from 'lodash-es';
import { setApiConfigInternal } from './globalState';
/**
 * Configures the global api settings for the entire library,
 * may be called at any time, but should be called in the main app component
 * before other stateful components are mounted.
 */
export const configureApi = (config) => setApiConfigInternal(cloneDeep(config));
