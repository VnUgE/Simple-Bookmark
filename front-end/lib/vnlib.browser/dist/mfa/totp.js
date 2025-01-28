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
/**
 * Creates a fido api for configuration and management of fido client devices
 * @param endpoint The fido server endpoint
 * @param axiosConfig The optional axios configuration to use
 * @returns An object containing the fido api
 */
export const useTotpApi = ({ sendRequest }) => {
    const enable = (options) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield sendRequest(Object.assign(Object.assign({}, options), { type: 'totp', action: 'enable' }));
        return data.getResultOrThrow();
    });
    const disable = (options) => {
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'totp', action: 'disable' }));
    };
    const verify = (code, options) => {
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'totp', action: 'verify', verify_code: code }));
    };
    const updateSecret = (options) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield sendRequest(Object.assign(Object.assign({}, options), { type: 'totp', action: 'update' }));
        return data.getResultOrThrow();
    });
    return {
        enable,
        disable,
        verify,
        updateSecret
    };
};
/**
 * Gets a pre-configured TOTP mfa flow processor
 * @returns A pre-configured TOTP mfa flow processor
 */
export const totpMfaProcessor = () => {
    const getContinuation = (payload, onSubmit) => __awaiter(void 0, void 0, void 0, function* () {
        return Object.assign(Object.assign({}, payload), { type: 'totp', submit: onSubmit.submit });
    });
    return {
        type: 'totp',
        getContinuation,
        isSupported: () => true //Totp is always supported there is no limiting api 
    };
};
