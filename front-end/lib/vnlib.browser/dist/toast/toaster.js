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
import { assign } from 'lodash-es';
import { get } from '@vueuse/core';
/* eslint-disable @typescript-eslint/no-explicit-any */
export const createToaster = (notifier, fallback) => {
    const success = (config) => {
        config.type = 'success';
        assign(config, fallback);
        get(notifier).notify(config);
    };
    const error = (config) => {
        config.type = 'error';
        assign(config, fallback);
        get(notifier).notify(config);
    };
    const info = (config) => {
        config.type = 'info';
        assign(config, fallback);
        get(notifier).notify(config);
    };
    const close = (id) => get(notifier).close(id);
    const notifyError = (title, message) => error({ title, text: message });
    return { success, error, info, close, notifyError };
};
/**
 * Creates a toaster for form notifications
 * @param notifier The send to write the notifications to
 * @returns A toaster to send form notifications to
 */
export const createFormToaster = (notifier) => {
    const formConfig = Object.freeze({
        group: 'form',
        ignoreDuplicates: true,
        // Froms only allow for one notification at a time
        max: 1,
        // Disable close on click
        closeOnClick: false
    });
    return createToaster(notifier, formConfig);
};
/**
 * The general toaster implementation of the IToaster interface
 */
export const createGeneralToaster = (notifier) => {
    //Setup config for the general toaster w/ the group set to general
    const config = Object.freeze({
        group: 'general'
    });
    return createToaster(notifier, config);
};
