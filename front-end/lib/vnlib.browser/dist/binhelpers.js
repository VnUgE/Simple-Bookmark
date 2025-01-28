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
export const LongToArray = function (long) {
    // Empty array
    const byteArray = Array(8).fill(0);
    for (let index = 0; index < 8; index++) {
        const byte = long & 0xff;
        byteArray[index] = byte;
        long = (long - byte) / 256;
    }
    return byteArray;
};
export const IntToArray = function (int) {
    // Empty array
    const byteArray = Array(4).fill(0);
    for (let index = 0; index < 4; index++) {
        const byte = int & 0xff;
        byteArray[index] = byte;
        int = (int - byte) / 256;
    }
    return byteArray;
};
export const Base64ToArray = function (b64string) {
    // Recover the encoded data
    const decData = atob(b64string);
    // Convert to array
    return Array.from(decData, c => c.charCodeAt(0));
};
export const Base64ToUint8Array = function (b64string) {
    // Recover the encoded data
    const decData = atob(b64string);
    // Convert to array
    return Uint8Array.from(decData, c => c.charCodeAt(0));
};
export const Utf8StringToBuffer = function (str) {
    // encode the string to utf8 binary
    const enc = new TextEncoder().encode(str);
    return Array.from(enc);
};
export const ArrayBuffToBase64 = function (e) {
    const arr = Array.from(new Uint8Array(e));
    return btoa(String.fromCharCode.apply(null, arr));
};
export const ArrayToHexString = function (buffer) {
    return Array.prototype.map.call(buffer, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};
