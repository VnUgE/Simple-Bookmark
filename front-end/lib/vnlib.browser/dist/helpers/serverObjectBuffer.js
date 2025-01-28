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
import { clone, isEqual, assign } from 'lodash-es';
import { reactive, computed } from 'vue';
const createObjectBuffer = (initialData) => {
    /**
     * The data is a reactive clone of the initial data state. It is used to store the current state of the resource.
     */
    const data = reactive(clone(initialData || {}));
    /**
     * The buffer is a reactive clone of the initial data state. It is used to track changes.
     */
    const buffer = reactive(clone(initialData || {}));
    /**
     * A computed value that indicates if the buffer has been modified from the data
     * @returns {boolean} True if the buffer has been modified from the data
     */
    const modified = computed(() => !isEqual(buffer, data));
    /**
     * Applies the new server response data to the resource data and reverts the buffer to the resource data
     * @param newData The new server response data to apply to the buffer
     */
    const apply = (newData) => {
        // Apply the new data to the buffer
        assign(data, newData);
        // Revert the buffer to the resource data
        assign(buffer, data);
    };
    /**
     * Reverts the buffer to the resource data
     */
    const revert = () => {
        assign(buffer, data);
    };
    return { data, buffer, modified, apply, revert };
};
const createUpdatableBuffer = (initialData, onUpdate) => {
    //Configure the initial data state and the buffer
    const state = createObjectBuffer(initialData);
    /**
     * Pushes buffered changes to the server if configured
     */
    const update = () => __awaiter(void 0, void 0, void 0, function* () {
        return onUpdate ? onUpdate(state) : Promise.resolve(undefined);
    });
    return Object.assign(Object.assign({}, state), { update });
};
const _useDataBuffer = (initialData, onUpdate) => {
    return onUpdate ? createUpdatableBuffer(initialData, onUpdate) : createObjectBuffer(initialData);
};
/**
 * Cretes a buffer object that represents server data, tracks changes,
 * can revert changes, and can optionally push buffered changes to the server
 */
export const useDataBuffer = _useDataBuffer;
