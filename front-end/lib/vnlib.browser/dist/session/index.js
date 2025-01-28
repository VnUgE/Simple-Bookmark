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
import { getGlobalStateInternal } from "../globalState";
import { createStorageSlot, manualComputed } from "../storage";
import { createSession } from "./internal";
import Cookies from 'universal-cookie';
/**
 * Gets the global session api instance
 * @returns The session api instance
 */
const _sessionInternal = (() => {
    //Use reactive config
    const conf = getGlobalStateInternal();
    const session = manualComputed(() => conf.get('session'));
    //create reactive storage slots (with defaults)
    const sessionState = createStorageSlot('_vn-session', { token: null, browserId: null });
    const keyStore = createStorageSlot('_vn-keys', { priv: null, pub: null });
    const cookies = new Cookies();
    return () => createSession(session, keyStore, sessionState, cookies);
})();
/**
 * Gets the global session api instance
 * @returns The session api instance
 */
export const useSession = () => _sessionInternal();
