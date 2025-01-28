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
import { defer, isEmpty, isNil } from 'lodash-es';
import { SignJWT } from 'jose';
import { getCryptoOrThrow, decryptAsync, getRandomHex } from "../webcrypto";
import { ArrayBuffToBase64, Base64ToUint8Array } from '../binhelpers';
import { debugLog } from "../util";
const keyStore = (storage, config) => {
    const { priv, pub } = storage;
    const getPublicKey = () => __awaiter(void 0, void 0, void 0, function* () {
        let pubKey = yield pub.get();
        //Check if we have a public key
        if (isNil(pubKey)) {
            //If not, generate a new key pair
            yield checkAndSetKeysAsync();
            return (yield pub.get()) || "";
        }
        return pubKey;
    });
    const setCredentialAsync = (keypair) => __awaiter(void 0, void 0, void 0, function* () {
        const crypto = getCryptoOrThrow();
        // Store the private key
        const newPrivRaw = yield crypto.exportKey('pkcs8', keypair.privateKey);
        const newPubRaw = yield crypto.exportKey('spki', keypair.publicKey);
        //Store keys as base64 strings
        yield Promise.all([
            priv.set(ArrayBuffToBase64(newPrivRaw)),
            pub.set(ArrayBuffToBase64(newPubRaw))
        ]);
    });
    const clearKeys = () => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all([
            priv.set(null), //Set null in parallel 
            pub.set(null)
        ]);
    });
    const checkAndSetKeysAsync = () => __awaiter(void 0, void 0, void 0, function* () {
        const pubKey = yield pub.get();
        const privKey = yield priv.get();
        // Check if we have a key pair already
        if (!isNil(pubKey) && !isNil(privKey)) {
            return;
        }
        const crypto = getCryptoOrThrow();
        const { keyAlgorithm } = config.get();
        // If not, generate a new key pair
        const keypair = yield crypto.generateKey(keyAlgorithm, true, ['encrypt', 'decrypt']);
        yield setCredentialAsync(keypair);
        debugLog("Generated new client keypair, none were found");
    });
    const regenerateKeysAsync = () => {
        //Clear keys and generate new ones
        clearKeys();
        return checkAndSetKeysAsync();
    };
    const decryptDataAsync = (data) => __awaiter(void 0, void 0, void 0, function* () {
        const secKey = yield priv.get();
        // Convert the private key to a Uint8Array from its base64 string
        const keyData = Base64ToUint8Array(secKey || "");
        const crypto = getCryptoOrThrow();
        const { keyAlgorithm } = config.get();
        //import private key as pkcs8
        const privKey = yield crypto.importKey('pkcs8', keyData, keyAlgorithm, false, ['decrypt']);
        return yield decryptAsync(keyAlgorithm, privKey, data, false);
    });
    const decryptAndHashAsync = (data) => __awaiter(void 0, void 0, void 0, function* () {
        // Decrypt the data
        const decrypted = yield decryptDataAsync(data);
        const crypto = getCryptoOrThrow();
        // Hash the decrypted data
        const hashed = yield crypto.digest({ name: 'SHA-256' }, decrypted);
        // Convert the hash to a base64 string
        return ArrayBuffToBase64(hashed);
    });
    return {
        getPublicKey,
        clearKeys,
        regenerateKeysAsync,
        decryptDataAsync,
        decryptAndHashAsync
    };
};
export const createSession = (config, keyStorage, state, cookies) => {
    const otpNonceSize = 16;
    //Create session state and key store
    const { browserId, token } = state;
    const KeyStore = keyStore(keyStorage, config);
    const getBrowserId = () => __awaiter(void 0, void 0, void 0, function* () {
        let val = yield browserId.get();
        // Check browser id
        if (isNil(val)) {
            const { browserIdSize } = config.get();
            // generate a new random value and store it
            val = getRandomHex(browserIdSize);
            yield browserId.set(val);
            debugLog("Generated new browser id, none was found");
        }
        return val;
    });
    const updateCredentials = (response) => __awaiter(void 0, void 0, void 0, function* () {
        /*
        * The server sends an encrypted HMAC key
        * using our public key. We need to decrypt it
        * and use it to sign messages to the server.
        */
        const decrypted = yield KeyStore.decryptDataAsync(response.token);
        // Convert the hash to a base64 string and store it
        yield token.set(ArrayBuffToBase64(decrypted));
    });
    const generateOneTimeToken = (path) => __awaiter(void 0, void 0, void 0, function* () {
        const tokenVal = yield token.get();
        //we need to get the shared key from storage and decode it, it may be null if not set
        const sharedKey = tokenVal ? Base64ToUint8Array(tokenVal) : null;
        if (!sharedKey) {
            return null;
        }
        //Inint jwt with a random nonce
        const nonce = getRandomHex(otpNonceSize);
        //Get the user desired signature algorithm
        const { signatureAlgorithm: alg } = config.get();
        const jwt = new SignJWT({ 'nonce': nonce, path });
        //Set alg
        jwt.setProtectedHeader({ alg })
            //Iat is the only required claim at the current time utc
            .setIssuedAt()
            .setAudience(window.location.origin);
        //Sign the jwt
        const signedJWT = yield jwt.sign(sharedKey);
        return signedJWT;
    });
    const clearLoginState = () => {
        browserId.set(null);
        token.set(null);
        KeyStore.clearKeys();
    };
    const getClientSecInfo = () => __awaiter(void 0, void 0, void 0, function* () {
        //Generate and get the credential info
        const publicKey = yield KeyStore.getPublicKey();
        const browserId = yield getBrowserId();
        return { publicKey, browserId };
    });
    const getCookie = () => {
        const { cookiesEnabled, loginCookieName } = config.get();
        const value = cookiesEnabled
            ? cookies.get(loginCookieName || '', { doNotParse: true })
            : undefined;
        return {
            enabled: cookiesEnabled,
            cookieValue: value,
        };
    };
    const isTokenSet = (token) => {
        return !isEmpty(token);
    };
    const isCookieValueValid = (cookieValue) => {
        return cookieValue === "1" || cookieValue === "2";
    };
    const isLoggedIn = () => __awaiter(void 0, void 0, void 0, function* () {
        const tokenVal = yield state.token.get();
        const { enabled, cookieValue } = getCookie();
        return isTokenSet(tokenVal) && (enabled ? isCookieValueValid(cookieValue) : true);
    });
    const isLocalAccount = () => __awaiter(void 0, void 0, void 0, function* () {
        const { cookieValue } = getCookie();
        return cookieValue === "1";
    });
    const reconcileState = () => {
        defer(() => __awaiter(void 0, void 0, void 0, function* () {
            /**
             * If
             *  - cookies are enabled,
             *  - there is no cookie value
             *
             * Then the token can be cleared so ui is reset and ready for the
             * next login
             */
            const { enabled, cookieValue } = getCookie();
            if (enabled && isNil(cookieValue)) {
                yield token.set(null);
            }
        }));
    };
    const addChangeListener = (callback) => {
        cookies.addChangeListener(callback);
    };
    return {
        KeyStore,
        isLoggedIn,
        isLocalAccount,
        updateCredentials,
        generateOneTimeToken,
        clearLoginState,
        getClientSecInfo,
        reconcileState,
        addChangeListener
    };
};
