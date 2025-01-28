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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { find, first, isArray, isEqual, map } from "lodash-es";
import Cookies from "universal-cookie";
import { useAccount } from "../account";
import { useAxios } from "../axios";
import { useSession } from "../session";
/**
 * Creates a new social login api for the given methods
 */
export const useOauthLogin = (methods) => {
    const cookieName = 'active-social-login';
    //A cookie will hold the status of the current login method
    const c = new Cookies(null, { sameSite: 'strict', httpOnly: false });
    const getActiveMethod = () => {
        const methodName = c.get(cookieName);
        return find(methods, method => isEqual(method.id, methodName));
    };
    const beginLoginFlow = (method) => {
        return method.beginLoginFlow();
    };
    const completeLogin = () => __awaiter(void 0, void 0, void 0, function* () {
        const method = find(methods, method => method.isActiveLogin());
        if (!method) {
            throw new Error('The current url is not a valid social login url');
        }
        yield method.completeLogin();
        //Set the cookie to the method id
        c.set(cookieName, method.id);
    });
    const logout = () => __awaiter(void 0, void 0, void 0, function* () {
        //see if any methods are active, then call logout on the active method
        const method = getActiveMethod();
        if (!method) {
            return false;
        }
        const result = yield method.logout();
        //clear cookie on success
        c.remove(cookieName);
        if (result) {
            yield result();
        }
        return true;
    });
    return {
        beginLoginFlow,
        completeLogin,
        getActiveMethod,
        logout,
        methods
    };
};
/**
 * Creates a new oauth2 login api for the given methods
 */
export const fromSocialConnections = (methods, axiosConfig) => {
    const { KeyStore } = useSession();
    const { prepareLogin, logout: userLogout } = useAccount();
    const axios = useAxios(axiosConfig);
    const getNonceQuery = () => new URLSearchParams(window.location.search).get('nonce');
    const getResultQuery = () => new URLSearchParams(window.location.search).get('result');
    const checkForValidResult = () => {
        //Get auth result from query params
        const result = getResultQuery();
        switch (result) {
            case 'invalid':
                throw new Error('The request was invalid, and you could not be logged in. Please try again.');
            case 'expired':
                throw new Error('The request has expired. Please try again.');
            //Continue with login
            case 'authorized':
                break;
            default:
                throw new Error('There was an error processing the login request. Please try again.');
        }
    };
    return map(methods, method => {
        return {
            id: method.id,
            icon: method.icon,
            beginLoginFlow() {
                return __awaiter(this, void 0, void 0, function* () {
                    //Prepare the login claim`
                    const claim = yield prepareLogin();
                    const { data } = yield axios.put(method.loginUrl(), claim);
                    const encDat = data.getResultOrThrow();
                    // Decrypt the result which should be a redirect url
                    const result = yield KeyStore.decryptDataAsync(encDat);
                    // get utf8 text
                    const text = new TextDecoder('utf-8').decode(result);
                    // Recover url
                    const redirect = new URL(text);
                    // Force https
                    redirect.protocol = 'https:';
                    // redirect to the url
                    window.location.href = redirect.href;
                });
            },
            completeLogin() {
                return __awaiter(this, void 0, void 0, function* () {
                    checkForValidResult();
                    //Recover the nonce from query params
                    const nonce = getNonceQuery();
                    if (!nonce) {
                        throw new Error('The current session has not been initialized for social login');
                    }
                    //Prepare the session for a new login
                    const login = yield prepareLogin();
                    //Send a post request to the endpoint to complete the login and pass the nonce argument
                    const { data } = yield axios.post(method.loginUrl(), Object.assign(Object.assign({}, login), { nonce }));
                    //Verify result
                    data.getResultOrThrow();
                    //Complete login authorization
                    yield login.finalize(data);
                });
            },
            isActiveLogin() {
                const loginUrl = method.loginUrl();
                //Check for absolute url, then check if the path is the same
                if (loginUrl.startsWith('http')) {
                    const asUrl = new URL(loginUrl);
                    return isEqual(asUrl.pathname, window.location.pathname);
                }
                //Relative url
                return isEqual(loginUrl, window.location.pathname);
            },
            logout() {
                return __awaiter(this, void 0, void 0, function* () {
                    /**
                     * If no logout data method is defined, then the logout
                     * is handled by a normal account logout
                     */
                    if (!method.getLogoutData) {
                        //Normal user logout
                        const result = yield userLogout();
                        if (method.onSuccessfulLogout) {
                            method.onSuccessfulLogout(result);
                        }
                        return;
                    }
                    const { url, args } = method.getLogoutData();
                    //Exec logout post request against the url
                    const { data } = yield axios.post(url, args);
                    //Signal the method that the logout was successful
                    return method.onSuccessfulLogout ? method.onSuccessfulLogout(data) : undefined;
                });
            },
        };
    });
};
/**
 * Adds a default logout function to the social login api that will
 * call the user supplied logout function if the social logout does not
 * have a registered logout method
 */
export const useSocialDefaultLogout = (socialOauth, logout) => {
    //Store old logout function for later use
    const logoutFunc = socialOauth.logout;
    socialOauth.logout = () => __awaiter(void 0, void 0, void 0, function* () {
        //If no logout was handled by social, fall back to user supplied logout
        if ((yield logoutFunc()) === false) {
            yield logout();
        }
        return true;
    });
    return socialOauth;
};
export const fromSocialPortals = (portals) => {
    return map(portals, p => {
        return {
            id: p.id,
            icon: p.icon,
            loginUrl: () => p.login,
            //Get the logout data from the server
            getLogoutData: () => ({ url: p.logout, args: {} }),
            //Redirect to the logout url returned by the server
            onSuccessfulLogout: (data) => {
                if (data.url) {
                    return () => {
                        window.location.assign(data.url);
                        return Promise.resolve();
                    };
                }
            },
            onSuccessfulLogin: () => { }
        };
    });
};
export const fetchSocialPortals = (portalEndpoint, axiosConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    //Get axios instance
    const axios = useAxios(axiosConfig);
    //Get all enabled portals
    const { data } = yield axios.get(portalEndpoint);
    /**
     * See if the response was a json array.
     *
     * Sometimes axios will parse HTML as json and still
     * return an object array, so if its an array, then
     * verify that at least one element is a valid portal
     */
    if (isArray(data)) {
        if (data.length === 0) {
            return [];
        }
        return ((_a = first(data)) === null || _a === void 0 ? void 0 : _a.id) ? data : [];
    }
    throw new Error('The response from the server was not a valid json array');
});
