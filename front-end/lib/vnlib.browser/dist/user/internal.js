// Copyright (c) 2023 Vaughn Nugent
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
import { isNil, defaultTo, defaults } from 'lodash-es';
import { computed, watch } from "vue";
import { get, set, toRefs } from '@vueuse/core';
export var AccountEndpoint;
(function (AccountEndpoint) {
    AccountEndpoint["Login"] = "login";
    AccountEndpoint["Logout"] = "logout";
    AccountEndpoint["Register"] = "register";
    AccountEndpoint["Reset"] = "reset";
    AccountEndpoint["Profile"] = "profile";
    AccountEndpoint["HeartBeat"] = "keepalive";
})(AccountEndpoint || (AccountEndpoint = {}));
export const createUser = (config, axios, session, state) => {
    //always set default value before call to toRefs
    defaults(state.value, { userName: undefined });
    const { accountBasePath } = toRefs(config);
    const { userName } = toRefs(state);
    const getEndpoint = (endpoint) => `${get(accountBasePath)}/${endpoint}`;
    const prepareLogin = () => __awaiter(void 0, void 0, void 0, function* () {
        //Store a copy of the session data and the current time for the login request
        const finalize = (response) => __awaiter(void 0, void 0, void 0, function* () {
            //Update the session with the new credentials
            yield session.updateCredentials(response);
            //Update the user state with the new username
            set(userName, response.email);
        });
        //Get or regen the client public key
        const { publicKey, browserId } = yield session.getClientSecInfo();
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
    //Expose the logged in state behind multiple refs
    const loggedIn = computed(() => session.loggedIn.value);
    //We want to watch the loggin ref and if it changes to false, clear the username
    watch(loggedIn, value => value === false ? set(userName, undefined) : undefined);
    const logout = () => __awaiter(void 0, void 0, void 0, function* () {
        //Get axios with logout endpoint
        const { post } = get(axios);
        const ep = getEndpoint(AccountEndpoint.Logout);
        // Send a post to the account logout endpoint to logout
        const { data } = yield post(ep, {});
        //regen session credentials on successful logout
        yield session.KeyStore.regenerateKeysAsync();
        // return the response
        return data;
    });
    const login = (userName, password) => __awaiter(void 0, void 0, void 0, function* () {
        //Get axios and the login endpoint
        const { post } = get(axios);
        const ep = getEndpoint(AccountEndpoint.Login);
        const prepped = yield prepareLogin();
        //Set the username and password
        prepped.username = userName;
        prepped.password = password;
        //Send the login request
        const { data } = yield post(ep, prepped);
        // Check the response
        if (data.success === true) {
            // If the server returned a token, complete the login
            if (!isNil(data.token)) {
                yield prepped.finalize(data);
            }
        }
        return Object.assign(Object.assign({}, data), { finalize: prepped.finalize });
    });
    const getProfile = () => __awaiter(void 0, void 0, void 0, function* () {
        //Get axios and the profile endpoint
        const ax = get(axios);
        const ep = getEndpoint(AccountEndpoint.Profile);
        // Get the user's profile from the profile endpoint
        const response = yield ax.get(ep);
        //Update the internal username if it was set by the server
        const newUsername = defaultTo(response.data.email, get(userName));
        //Update the user state with the new username from the server
        set(userName, newUsername);
        // return response data
        return response.data;
    });
    const resetPassword = (current, newPass, args) => __awaiter(void 0, void 0, void 0, function* () {
        //Get axios and the reset password endpoint
        const { post } = get(axios);
        const ep = getEndpoint(AccountEndpoint.Reset);
        // Send a post to the reset password endpoint
        const { data } = yield post(ep, Object.assign({ current, new_password: newPass }, args));
        return data;
    });
    const heartbeat = () => __awaiter(void 0, void 0, void 0, function* () {
        //Get axios and the heartbeat endpoint
        const { post } = get(axios);
        const ep = getEndpoint(AccountEndpoint.HeartBeat);
        // Send a post to the heartbeat endpoint
        const response = yield post(ep);
        //If success flag is set, update the credentials
        if (response.data.success) {
            //Update credential
            yield session.updateCredentials(response.data);
        }
        return response;
    });
    return {
        userName,
        prepareLogin,
        logout,
        login,
        getProfile,
        resetPassword,
        heartbeat,
        getEndpoint,
    };
};
