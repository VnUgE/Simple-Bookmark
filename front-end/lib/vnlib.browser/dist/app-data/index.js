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
import { get } from '@vueuse/core';
import { useAxios } from '../axios';
import { defaultTo, first } from 'lodash-es';
/**
 * Creates an AppData API for the given endpoint
 * @param endpoint The endpoint to use
 * @param axios The optional axios instance to use for requests
 * @returns The AppData API
 */
export const useAppDataApi = (endpoint, axios) => {
    axios = defaultTo(axios, useAxios(null));
    const getUrl = ({ flush, noCache, scope }) => {
        const fl = flush ? '&flush=true' : '';
        const nc = noCache ? '&no_cache=true' : '';
        return `${get(endpoint)}?scope=${scope}${nc}${fl}`;
    };
    return {
        get: (scope_1, ...args_1) => __awaiter(void 0, [scope_1, ...args_1], void 0, function* (scope, { noCache } = {}) {
            var _a;
            const url = getUrl({
                scope,
                noCache: (noCache || false),
                flush: false
            });
            //Handle status code errors manually
            const response = yield axios.get(url, {
                validateStatus: (status) => status >= 200 && status < 500
            });
            switch (response.status) {
                case 200:
                    break;
                case 404:
                    return undefined;
                default:
                    (_a = response.data) === null || _a === void 0 ? void 0 : _a.getResultOrThrow();
                    throw { response };
            }
            if ('getResultOrThrow' in response.data) {
                let d = Object.assign({}, response.data);
                delete d.getResultOrThrow;
                return d;
            }
            return response.data;
        }),
        set: (scope_1, data_1, ...args_1) => __awaiter(void 0, [scope_1, data_1, ...args_1], void 0, function* (scope, data, { wait } = {}) {
            const url = getUrl({
                scope,
                noCache: false,
                flush: (wait || false)
            });
            //Handle status code errors manually
            const { status, data: responseData } = yield axios.put(url, data);
            switch (status) {
                case 200:
                case 202:
                    break;
                default:
                    responseData === null || responseData === void 0 ? void 0 : responseData.getResultOrThrow();
                    break;
            }
        }),
        remove: (scope) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            //Handle status code errors manually
            const response = yield axios.delete(getUrl({ scope, noCache: false, flush: false }));
            switch (response.status) {
                case 200:
                case 202:
                    break;
                default:
                    (_a = response.data) === null || _a === void 0 ? void 0 : _a.getResultOrThrow();
                    throw { response };
            }
        })
    };
};
/**
 * Creates an AppData API that uses at constant scope for all requests
 * @param endpoint The app-data endpoint to use
 * @param scope The data request scope
 * @param axios The optional axios instance to use for requests
 */
export const useScopedAppDataApi = (endpoint, scope, axios) => {
    const api = useAppDataApi(endpoint, axios);
    return {
        get: (options) => api.get(get(scope), options),
        set: (data, options) => api.set(get(scope), data, options),
        remove: () => api.remove(get(scope))
    };
};
/**
 * Creates a StorageLikeAsync object that uses the given UserAppDataApi
 * @param api The UserAppDataApi instance to use
 * @returns The StorageLikeAsync object
 */
export const useAppDataAsyncStorage = (api) => {
    return {
        getItem: (key) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield api.get(key);
            return first(result) || null;
        }),
        setItem: (key, value) => {
            //NOTE: An array is used to force axios to serialize the
            //value and send the data to the server a file
            return api.set(key, [value]);
        },
        removeItem: (key) => __awaiter(void 0, void 0, void 0, function* () {
            return api.remove(key);
        })
    };
};
