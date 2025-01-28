// Copyright (c) 2023 Vaughn Nugent
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
import { useSession } from "../session";
import { useAxiosInternal } from '../axios';
import { createUser } from './internal';
import { StorageKey, getGlobalStateInternal, createStorageSlot } from '../globalState';
/**
 * Gets the global user interface
 * @returns The users api instance
 */
export const useUser = (() => {
    const _userStorage = createStorageSlot(StorageKey.User, { userName: undefined });
    const { user } = getGlobalStateInternal();
    //Use global axios instance
    const _axios = useAxiosInternal();
    //Use global session
    const _session = useSession();
    return () => createUser(user, _axios, _session, _userStorage);
})();
