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
import { cloneDeep, merge, isObjectLike, defaultTo, get } from 'lodash-es';
import axios from 'axios';
import { useSession } from '../session';
import { getGlobalStateInternal } from '../globalState';
import { manualComputed } from '../storage';
const getInterceptors = (_config) => {
    const { generateOneTimeToken } = useSession();
    return {
        request: {
            onFufilled: (config) => __awaiter(void 0, void 0, void 0, function* () {
                //Get the current global config/token header value
                const { tokenHeader } = _config.get();
                // See if the current session is logged in
                if (tokenHeader) {
                    const path = `${config.baseURL}${config.url}`;
                    let pathName = path;
                    //see if absolute url or relative
                    if (path.match(/https?:\/\//)) {
                        //Is absolute
                        pathName = new URL(path).pathname;
                    }
                    // Get an otp for the request (may be null if not logged in)
                    const token = yield generateOneTimeToken(pathName);
                    if (token) {
                        config.headers[tokenHeader] = token;
                    }
                }
                // Return the config
                return config;
            }),
            onError: (error) => {
                // Do something with request error
                return Promise.reject(error);
            }
        },
        response: {
            //Add response interceptor to add a function to the response to get the result or throw an error to match the WebMessage server message
            onFulfilled: (response) => {
                //Add a function to the response to get the result or throw an error
                if (isObjectLike(response.data)) {
                    response.data.getResultOrThrow = () => {
                        if (response.data.success) {
                            return response.data.result;
                        }
                        else {
                            //Throw in apicall format to catch in the catch block
                            throw { response };
                        }
                    };
                }
                return response;
            }
        }
    };
};
/**
 * Gets a reactive axios instance with the default configuration
 * @param config Optional Axios instance configuration to apply, will be merged with the default config
 * @returns A reactive ref to an axios instance
 */
export const useAxios = (() => {
    //Get the session and utils
    const config = getGlobalStateInternal();
    const _axiosConfig = manualComputed(() => config.get('axios'));
    const { request, response } = getInterceptors(_axiosConfig);
    return (config) => {
        const getInstance = () => {
            const getMergedConfig = () => {
                const global = _axiosConfig.get();
                const local = defaultTo(config, {});
                return merge(cloneDeep(global), local);
            };
            const merged = getMergedConfig();
            let instance = axios.create(merged);
            //Exec user configuration callback if it's defined
            if (merged.configureAxios) {
                instance = merged.configureAxios(instance);
            }
            //Assign cached interceptors
            instance.interceptors.request.use(request.onFufilled, request.onError);
            instance.interceptors.response.use(response.onFulfilled);
            return instance;
        };
        let ax = getInstance();
        //Use a proxy for axios to get the configuration
        return new Proxy(ax, {
            get: (target, prop) => {
                //If the config has changed, get a new instance
                if (_axiosConfig.changed()) {
                    ax = getInstance();
                }
                return get(ax, prop);
            },
        });
    };
})();
