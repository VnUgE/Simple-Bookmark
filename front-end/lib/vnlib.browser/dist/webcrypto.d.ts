export declare const isCryptoSupported: () => boolean;
export declare const getCryptoOrThrow: () => SubtleCrypto;
/**
 * Signs the dataBuffer using the specified key and hmac algorithm by its name eg. 'SHA-256'
 * @param {ArrayBuffer | String} dataBuffer The data to sign, either as an ArrayBuffer or a base64 string
 * @param {ArrayBuffer | String} keyBuffer The raw key buffer, or a base64 encoded string
 * @param {String} alg The name of the hmac algorithm to use eg. 'SHA-256'
 * @param {String} [toBase64 = false] The output format, the array buffer data, or true for base64 string
 * @returns {Promise<ArrayBuffer | String>} The signature as an ArrayBuffer or a base64 string
 * @throws An error if the browser does not support the Web Cryptography API
 */
export declare const hmacSignAsync: (keyBuffer: ArrayBuffer | string, dataBuffer: ArrayBuffer | string, alg: string, toBase64?: boolean) => Promise<ArrayBuffer | string>;
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
export declare const decryptAsync: (algorithm: AlgorithmIdentifier, privKey: BufferSource | CryptoKey | JsonWebKey, data: string | ArrayBuffer, toBase64?: boolean) => Promise<string | ArrayBuffer>;
/**
 * Gets a random hex string of the specified size
 * @param size The number of bytes to generate
 * @returns A random hex string of the specified size
 * @throws An error if the browser does not support the Web Cryptography API
 */
export declare const getRandomHex: (size: number) => string;
