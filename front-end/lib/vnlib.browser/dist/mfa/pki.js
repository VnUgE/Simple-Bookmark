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
import { decodeJwt } from "jose";
import { trim } from "lodash-es";
import { useAccount, useAccountRpc } from "../account";
import { debugLog } from "../util";
/**
 * Creates a pki login api that allows for authentication with a signed JWT
 */
export const useOtpAuth = () => {
    const { prepareLogin } = useAccount();
    const { exec } = useAccountRpc();
    const login = (pkiJwt) => __awaiter(void 0, void 0, void 0, function* () {
        //trim any padding 
        pkiJwt = trim(pkiJwt);
        //try to decode the jwt to confirm its form is valid
        const jwt = decodeJwt(pkiJwt);
        debugLog(jwt);
        //Prepare a login message
        const loginMessage = yield prepareLogin();
        //Set the 'login' field to the otp
        loginMessage.login = pkiJwt;
        const data = yield exec('otp.login', loginMessage);
        data.getResultOrThrow();
        if ('token' in data) {
            //Finalize the login
            yield loginMessage.finalize(data);
        }
        return data;
    });
    return { login };
};
/**
 * Gets the api for interacting with the the user's pki configuration
 * @param pkiEndpoint The server pki endpoint relative to the base url
 * @returns An object containing the pki api
 */
export const useOtpApi = ({ sendRequest }) => {
    const addOrUpdate = (publicKey, options) => __awaiter(void 0, void 0, void 0, function* () {
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'pkotp', action: 'add_key', public_key: publicKey }));
    });
    const disable = (options) => {
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'pkotp', action: 'disable' }));
    };
    const removeKey = (key, options) => {
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'pkotp', action: 'remove_key', delete_id: key.kid }));
    };
    return { addOrUpdate, disable, removeKey };
};
