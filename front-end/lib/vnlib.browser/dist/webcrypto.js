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
import { isArrayBuffer, isPlainObject, isString } from 'lodash-es';
import { ArrayBuffToBase64, Base64ToUint8Array, ArrayToHexString } from './binhelpers';
export const isCryptoSupported = () => {
    return !!(window.isSecureContext && window.crypto && window.crypto.subtle);
};
export const getCryptoOrThrow = () => {
    if (!isCryptoSupported()) {
        throw new Error('Your browser does not support the Web Cryptography API');
    }
    return window.crypto.subtle;
};
/**
 * Signs the dataBuffer using the specified key and hmac algorithm by its name eg. 'SHA-256'
 * @param {ArrayBuffer | String} dataBuffer The data to sign, either as an ArrayBuffer or a base64 string
 * @param {ArrayBuffer | String} keyBuffer The raw key buffer, or a base64 encoded string
 * @param {String} alg The name of the hmac algorithm to use eg. 'SHA-256'
 * @param {String} [toBase64 = false] The output format, the array buffer data, or true for base64 string
 * @returns {Promise<ArrayBuffer | String>} The signature as an ArrayBuffer or a base64 string
 * @throws An error if the browser does not support the Web Cryptography API
 */
export const hmacSignAsync = (keyBuffer_1, dataBuffer_1, alg_1, ...args_1) => __awaiter(void 0, [keyBuffer_1, dataBuffer_1, alg_1, ...args_1], void 0, function* (keyBuffer, dataBuffer, alg, toBase64 = false) {
    const crypto = getCryptoOrThrow();
    // Check key argument type
    const rawKeyBuffer = isString(keyBuffer) ? Base64ToUint8Array(keyBuffer) : keyBuffer;
    // Check data argument type
    const rawDataBuffer = isString(dataBuffer) ? Base64ToUint8Array(dataBuffer) : dataBuffer;
    // Get the key
    const hmacKey = yield crypto.importKey('raw', rawKeyBuffer, { name: 'HMAC', hash: alg }, false, ['sign']);
    // Sign hmac data
    const digest = yield crypto.sign('HMAC', hmacKey, rawDataBuffer);
    // Encode to base64 if needed
    return toBase64 ? ArrayBuffToBase64(digest) : digest;
});
/**
 * @function decryptAsync Decrypts syncrhonous or asyncrhonsous en encypted data
 * asynchronously.
 * @param {any} data The encrypted data to decrypt. (base64 string or ArrayBuffer)
 * @param {any} privKey The key to use for decryption (base64 String or ArrayBuffer).
 * @param {Object} algorithm The algorithm object to use for decryption.
 * @param {Boolean} toBase64 If true, the decrypted data will be returned as a base64 string.
 * @returns {Promise} The decrypted data.
 * @throws An error if the browser does not support the Web Cryptography API
 */
export const decryptAsync = (algorithm_1, privKey_1, data_1, ...args_1) => __awaiter(void 0, [algorithm_1, privKey_1, data_1, ...args_1], void 0, function* (algorithm, privKey, data, toBase64 = false) {
    const crypto = getCryptoOrThrow();
    // Check data argument type and decode if needed
    const dataBuffer = isString(data) ? Base64ToUint8Array(data) : data;
    let privateKey = privKey;
    // Check key argument type
    if (privKey instanceof CryptoKey) {
        privateKey = privKey;
    }
    // If key is binary data, then import it as raw data
    else if (isArrayBuffer(privKey)) {
        privateKey = yield crypto.importKey('raw', privKey, algorithm, true, ['decrypt']);
    }
    // If the key is an object, then import it as a jwk
    else if (isPlainObject(privKey)) {
        privateKey = yield crypto.importKey('jwk', privKey, algorithm, true, ['decrypt']);
    }
    // Decrypt the data and return it
    const decrypted = yield crypto.decrypt(algorithm, privateKey, dataBuffer);
    return toBase64 ? ArrayBuffToBase64(decrypted) : decrypted;
});
/**
 * Gets a random hex string of the specified size
 * @param size The number of bytes to generate
 * @returns A random hex string of the specified size
 * @throws An error if the browser does not support the Web Cryptography API
 */
export const getRandomHex = (size) => {
    if (!isCryptoSupported()) {
        throw new Error('Your browser does not support the Web Cryptography API');
    }
    const randBuffer = new Uint8Array(size);
    window.crypto.getRandomValues(randBuffer);
    //Convert the random buffer to a hex string
    return ArrayToHexString(randBuffer);
};
