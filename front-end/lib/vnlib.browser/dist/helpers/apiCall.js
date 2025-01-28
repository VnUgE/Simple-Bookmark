// Copyright (c) 2025 Vaughn Nugent
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
import { AxiosError } from 'axios';
import { defaultTo, isArray, isNil, isEqual, first, isString } from 'lodash-es';
import { get, useConfirmDialog } from '@vueuse/core';
import { useFormToaster, useToaster } from '../toast';
import { useWait } from './wait';
import { useAxios } from '../axios';
const useApiCallInternal = (args) => {
    /**
     * Provides a wrapper method for making remote api calls to a server
     * while capturing context and errors and common api arguments.
     * @param {*} callback The method to call within api request context
     * @returns A promise that resolves to the result of the async function
     */
    return (callback) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const notifier = args.getNotifier();
        // Set the waiting flag
        args.setWaiting(true);
        try {
            //Close the current toast value
            notifier.close();
            const obj = args.getCallbackObject();
            //Exec the async function
            return yield callback(obj);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (errMsg) {
            console.error(errMsg);
            // See if the error has an axios response
            if (isNil(errMsg.response)) {
                if (errMsg.message === 'Network Error') {
                    notifier.notifyError('Please check your internet connection');
                }
                else {
                    notifier.notifyError('An unknown error occured');
                }
                return;
            }
            // Axios error message
            const response = errMsg.response;
            const errors = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.errors;
            const hasErrors = isArray(errors) && errors.length > 0;
            const SetMessageWithDefault = (message) => {
                var _a;
                if (hasErrors) {
                    const fe = first(errors);
                    if (isString(fe)) {
                        notifier.notifyError(fe);
                    }
                    else {
                        const { message, property } = fe;
                        notifier.notifyError('Please verify your ' + defaultTo(property, 'form'), message);
                    }
                }
                else {
                    notifier.notifyError(defaultTo((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.result, message));
                }
            };
            switch (response.status) {
                case 200:
                    SetMessageWithDefault('');
                    break;
                case 400:
                    SetMessageWithDefault('Bad Request');
                    break;
                case 422:
                    SetMessageWithDefault('The server did not accept the request');
                    break;
                case 401:
                    SetMessageWithDefault('You are not logged in.');
                    break;
                case 403:
                    SetMessageWithDefault('Please clear you cookies/cache and try again');
                    break;
                case 404:
                    SetMessageWithDefault('The requested resource was not found');
                    break;
                case 409:
                    SetMessageWithDefault('Please clear you cookies/cache and try again');
                    break;
                case 410:
                    SetMessageWithDefault('The requested resource has expired');
                    break;
                case 423:
                    SetMessageWithDefault('The requested resource is locked');
                    break;
                case 429:
                    SetMessageWithDefault('You have made too many requests, please try again later');
                    break;
                case 500:
                    SetMessageWithDefault('There was an error processing your request');
                    break;
                default:
                    SetMessageWithDefault('An unknown error occured');
                    break;
            }
        }
        finally {
            // Clear the waiting flag
            args.setWaiting(false);
        }
    });
};
/**
 * Provides a wrapper method for making remote api calls to a server
 * while capturing context and errors and common api arguments.
 * @returns {Object} The api call function object {apiCall: Promise }
 */
export const useApiCall = (notifier, axConfig) => {
    const axios = useAxios(axConfig);
    const toaster = useToaster();
    const { setWaiting } = useWait();
    const getCallbackObject = () => ({ axios, toaster });
    const getNotifier = () => get(notifier);
    //Confiugre the api call to use global configuration
    return {
        apiCall: useApiCallInternal({
            getCallbackObject,
            getNotifier,
            setWaiting
        })
    };
};
/**
 * Provides a wrapper method for making remote api calls to a server
 * while capturing context and errors and common api arguments.
 * @param {*} asyncFunc The method to call within api request context
 * @returns A promise that resolves to the result of the async function
 */
export const apiCall = (() => {
    const { apiCall } = useApiCall(useFormToaster());
    return apiCall;
})();
/**
 * Gets the shared password prompt object and the elevated api call method handler
 * to allow for elevated api calls that require a password.
 * @returns {Object} The password prompt configuration object, and the elevated api call method
 */
export const usePassConfirm = (() => {
    //Shared confirm object
    const confirm = useConfirmDialog();
    /**
     * Displays the password prompt and executes the api call with the password
     * captured from the prompt. If the api call returns a 401 error, the password
     * prompt is re-displayed and the server error message is displayed in the form
     * error toaster.
     * @param callback The async callback method that invokes the elevated api call.
     * @returns A promise that resolves to the result of the async function
     */
    const elevatedApiCall = (callback) => {
        //Invoke api call method but handle 401 errors by re-displaying the password prompt
        return apiCall((api) => __awaiter(void 0, void 0, void 0, function* () {
            // eslint-disable-next-line no-constant-condition
            while (1) {
                //Display the password prompt
                const { data, isCanceled } = yield confirm.reveal();
                if (isCanceled) {
                    break;
                }
                try {
                    //Execute the api call with prompt response
                    return yield callback(Object.assign(Object.assign({}, api), data));
                }
                //Catch 401 errors and re-display the password prompt, otherwise throw the error
                catch (err) {
                    if (!(err instanceof AxiosError)) {
                        throw err;
                    }
                    const { response } = err;
                    if (isNil(response)) {
                        throw err;
                    }
                    //Check status code, if 401, re-display the password prompt
                    if (!isEqual(response === null || response === void 0 ? void 0 : response.status, 401)) {
                        throw err;
                    }
                    //Display the error message
                    api.toaster.form.error({ title: response.data.result });
                    //Re-display the password prompt
                }
            }
        }));
    };
    //Pass through confirm object and elevated api call
    return () => (Object.assign(Object.assign({}, confirm), { elevatedApiCall }));
})();
