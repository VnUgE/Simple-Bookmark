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
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
/**
 * Creates a fido api for configuration and management of fido client devices
 * @param sendRequest The function to send a request to the server
 * @returns An object containing the fido api
 */
export const useFidoApi = ({ sendRequest }) => {
    const beginRegistration = (options) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield sendRequest(Object.assign(Object.assign({}, options), { type: 'fido', action: 'prepare_device' }));
        return data.getResultOrThrow();
    });
    const registerCredential = (reg, commonName, options) => {
        const registration = {
            id: reg.id,
            publicKey: reg.response.publicKey,
            publicKeyAlgorithm: reg.response.publicKeyAlgorithm,
            clientDataJSON: reg.response.clientDataJSON,
            authenticatorData: reg.response.authenticatorData,
            attestationObject: reg.response.attestationObject,
            friendlyName: commonName
        };
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'fido', action: 'register_device', registration }));
    };
    const registerDefaultDevice = (commonName, options) => __awaiter(void 0, void 0, void 0, function* () {
        //begin registration
        const serverOptions = yield beginRegistration(options);
        const reg = yield startRegistration(serverOptions);
        return yield registerCredential(reg, commonName, options);
    });
    const disableDevice = (device, options) => __awaiter(void 0, void 0, void 0, function* () {
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'fido', action: 'disable_device', device_id: device.id }));
    });
    const disableAllDevices = (options) => __awaiter(void 0, void 0, void 0, function* () {
        return sendRequest(Object.assign(Object.assign({}, options), { type: 'fido', action: 'disable_all' }));
    });
    return {
        isSupported: browserSupportsWebAuthn,
        beginRegistration,
        registerCredential,
        registerDefaultDevice,
        disableDevice,
        disableAllDevices
    };
};
/**
 * Enables fido as a supported multi-factor authentication method
 * @returns A mfa login processor for fido multi-factor
 */
export const fidoMfaProcessor = () => {
    const getContinuation = (payload, onSubmit) => {
        const authenticate = (useAutoFill, options) => __awaiter(void 0, void 0, void 0, function* () {
            if (!('fido' in payload)) {
                throw new Error('Fido mfa flow is not supported by the server. This is an internal error.');
            }
            const { fido } = payload;
            const result = yield startAuthentication(fido, useAutoFill);
            return yield onSubmit.submit(Object.assign({ fido: result }, options));
        });
        return Promise.resolve(Object.assign(Object.assign({}, payload), { authenticate, type: 'fido', submit: onSubmit.submit }));
    };
    return {
        type: "fido",
        getContinuation,
        isSupported: browserSupportsWebAuthn
    };
};
