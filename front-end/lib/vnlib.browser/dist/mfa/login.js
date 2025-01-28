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
import { map, mapKeys, without } from 'lodash-es';
import { debugLog } from "../util";
import { useAccountRpc, useAccount } from "../account";
const getMfaProcessor = (handlers) => {
    //Store handlers by their mfa type
    const handlerMap = mapKeys(handlers, (h) => h.type);
    const { exec } = useAccountRpc();
    //Creates a submission handler for an mfa upgrade
    const createSubHandler = (type, upgrade, finalize) => {
        const submit = (submission) => __awaiter(void 0, void 0, void 0, function* () {
            //Exec against the mfa.login method
            const data = yield exec('mfa.login', Object.assign(Object.assign({}, submission), { 
                //Pass raw upgrade message back to server as its signed
                upgrade,
                //Pass the desired mfa type back to the server
                type, 
                //Local time as an ISO string of the current time
                localtime: new Date().toISOString(), 
                //Tell endpoint this is an mfa submission
                mfa: true }));
            // If the server returned a token, finalize the login
            if (data.success && 'token' in data) {
                yield finalize(data);
            }
            return data;
        });
        return { submit };
    };
    const processMfa = (mfaMessage, finalize) => __awaiter(void 0, void 0, void 0, function* () {
        //Mfa message is a jwt, decode it (unsecure decode)
        const mfa = decodeJwt(mfaMessage);
        debugLog(mfa);
        const supportedContinuations = map(mfa.capabilities, (supportedType) => {
            //Select the mfa handler
            const handler = handlerMap[supportedType];
            //If no handler is found, throw an error
            if (!handler || handler.type !== supportedType) {
                return Promise.resolve(undefined);
            }
            //Init submission handler
            const submitHandler = createSubHandler(supportedType, mfaMessage, finalize);
            //Process the mfa message
            return handler.getContinuation(mfa, submitHandler);
        });
        const methods = yield Promise.all(supportedContinuations);
        return {
            expires: mfa.expires,
            methods: without(methods, undefined)
        };
    });
    const isSupported = (method) => {
        var _a;
        return ((_a = handlerMap[method]) === null || _a === void 0 ? void 0 : _a.isSupported()) || false;
    };
    return { processMfa, isSupported };
};
/**
 * Gets the mfa login handler for the accounts backend
 * @param handlers A list of mfa handlers to register
 * @returns The configured mfa login handler
 */
export const useMfaLogin = (handlers) => {
    //get the user instance
    const { login: userLogin } = useAccount();
    //Get new mfa processor
    const { processMfa, isSupported } = getMfaProcessor(handlers);
    //Login that passes through logins with mfa
    const login = (credential) => __awaiter(void 0, void 0, void 0, function* () {
        //User-login with mfa response
        const response = yield userLogin(credential);
        const { mfa, upgrade } = response.getResultOrThrow();
        //Get the mfa upgrade message from the server
        if (mfa && upgrade && mfa === true) {
            /**
             * Gets all contiuations from the server's list of supported
             * mfa upgrade types. This table will be the union of all
             * enabled client handlers and the mfa methods the user has
             * enabled on their account for continuation of the login process
             */
            const continuations = yield processMfa(upgrade, response.finalize);
            return Object.assign({}, continuations);
        }
        //If no mfa upgrade message is returned, the login is complete
        return response;
    });
    return { login, isSupported };
};
