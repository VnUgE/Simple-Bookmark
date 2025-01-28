// Copyright (c) 2025 Vaughn Nugent
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isNil } from 'lodash-es';
import { useSession } from '../session';
import { useAxios } from '../axios';
import { getGlobalStateInternal } from '../globalState';
import { manualComputed } from '../storage';
import { useJrpc } from '../helpers/jrpc';
/**
 * Gets the rpc api for interacting with the user's account/profile
 * login, mfa, and other account related functions
 */
export const useAccountRpc = () => {
    const gConfig = getGlobalStateInternal();
    const config = manualComputed(() => gConfig.get('account'));
    const { get } = useAxios();
    const { request } = useJrpc({
        endpoint: () => config.get('endpointUrl'),
        version: '2.0.0'
    });
    const getData = () => __awaiter(void 0, void 0, void 0, function* () {
        const ep = config.get('endpointUrl');
        const { data } = yield get(ep);
        return data;
    });
    const exec = (method, args) => __awaiter(void 0, void 0, void 0, function* () {
        return request(method, args);
    });
    return { getData, exec };
};
export const useAccount = () => {
    const { updateCredentials, getClientSecInfo, KeyStore } = useSession();
    const { exec } = useAccountRpc();
    const prepareLogin = () => __awaiter(void 0, void 0, void 0, function* () {
        //Store a copy of the session data and the current time for the login request
        const finalize = (response) => __awaiter(void 0, void 0, void 0, function* () {
            //Update the session with the new credentials
            yield updateCredentials(response);
        });
        //Get or regen the client public key
        const { publicKey, browserId } = yield getClientSecInfo();
        return {
            clientid: browserId,
            pubkey: publicKey,
            localtime: new Date().toISOString(),
            locallanguage: navigator.language,
            username: '',
            password: '',
            finalize
        };
    });
    const logout = () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield exec('logout');
        //regen session credentials on successful logout
        yield KeyStore.regenerateKeysAsync();
        // return the response
        return result;
    });
    const login = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userName, password }) {
        const prepped = yield prepareLogin();
        //Set the username and password
        prepped.username = userName;
        prepped.password = password;
        //Send the login request
        const data = yield exec('login', prepped);
        // Check the response
        if (data.success === true && 'token' in data) {
            // If the server returned a token, complete the login
            if (!isNil(data.token)) {
                yield prepped.finalize(data);
            }
        }
        return Object.assign(Object.assign({}, data), { finalize: prepped.finalize });
    });
    const getProfile = () => __awaiter(void 0, void 0, void 0, function* () {
        // Get the user's profile from the profile endpoint
        const data = yield exec('profile.get');
        // return response data
        return data.getResultOrThrow();
    });
    const resetPassword = (current, newPass, args) => __awaiter(void 0, void 0, void 0, function* () {
        // Send a post to the reset password endpoint
        const data = yield exec('password.reset', Object.assign(Object.assign({}, args), { current, new_password: newPass }));
        return data;
    });
    const heartbeat = () => __awaiter(void 0, void 0, void 0, function* () {
        // Send a post to the heartbeat endpoint
        const data = yield exec('heartbeat');
        //If success flag is set, update the credentials
        if (data.success && 'token' in data) {
            //Update credential
            yield updateCredentials(data);
        }
    });
    return {
        prepareLogin,
        logout,
        login,
        getProfile,
        resetPassword,
        heartbeat
    };
};
