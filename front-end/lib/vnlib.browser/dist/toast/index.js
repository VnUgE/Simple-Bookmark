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
import { shallowRef } from 'vue';
import { set } from '@vueuse/core';
import { debugLog } from '../util';
import { createFormToaster, createGeneralToaster } from './toaster';
class DefaultNotifier {
    notify(config) {
        debugLog(`Notification: ${config.title} - ${config.text}`);
    }
    close(id) {
        debugLog(`Notification closed: ${id}`);
    }
}
//Combined toaster impl
const createCombinedToaster = (notifier) => {
    const form = createFormToaster(notifier);
    const general = createGeneralToaster(notifier);
    const close = (id) => {
        form.close(id);
        general.close(id);
    };
    return Object.freeze({ form, general, close });
};
// The program handler for the notification
const _global = shallowRef(new DefaultNotifier());
/**
 * Configures the notification handler.
 * @param {*} notifier The method to call when a notification is to be displayed
 * @returns The notifier
 */
export const configureNotifier = (notifier) => set(_global, notifier);
/**
 * Gets the default toaster for general notifications
 * and the form toaster for form notifications
 * @returns {Object} The toaster contianer object
 */
export const useToaster = (notifier) => createCombinedToaster(notifier !== null && notifier !== void 0 ? notifier : _global);
/**
 * Gets the default toaster for from notifications
 */
export const useFormToaster = (notifier) => createFormToaster(notifier !== null && notifier !== void 0 ? notifier : _global);
/**
 * Gets the default toaster for general notifications
 * @returns {Object} The toaster contianer object
 */
export const useGeneralToaster = (notifier) => createGeneralToaster(notifier !== null && notifier !== void 0 ? notifier : _global);
