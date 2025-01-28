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
import { defaultsDeep, mapValues, memoize, get as getAt, set as setAt, isEqual } from 'lodash-es';
import { getGlobalStateInternal } from './globalState/index';
export const manualComputed = (getter) => {
    let lastValue = undefined;
    return {
        get: (propName) => {
            //Get an update the cached value
            lastValue = getter();
            return propName
                ? getAt(lastValue, propName)
                : lastValue;
        },
        changed: () => {
            const latest = getter();
            return isEqual(lastValue, latest);
        }
    };
};
export const createStorageSlot = (key, defaultValue) => {
    const config = getGlobalStateInternal();
    const backend = manualComputed(() => config.get('storage'));
    const writeObj = (value) => {
        var _a;
        const val = JSON.stringify(value);
        return (_a = backend.get()) === null || _a === void 0 ? void 0 : _a.setItem(key, val);
    };
    const readObj = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const val = yield ((_a = backend.get()) === null || _a === void 0 ? void 0 : _a.getItem(key));
        const obj = JSON.parse(val || '{}');
        return defaultsDeep(obj, defaultValue);
    });
    const storage = memoize(readObj);
    const clearCache = () => {
        if (storage.cache.clear) {
            storage.cache.clear();
        }
    };
    return mapValues(defaultValue, (_val, key) => {
        const get = () => __awaiter(void 0, void 0, void 0, function* () {
            const stored = yield storage();
            return getAt(stored, key);
        });
        const set = (value) => __awaiter(void 0, void 0, void 0, function* () {
            const stored = yield storage();
            setAt(stored, key, value);
            //Write localstorage
            yield writeObj(stored);
            clearCache();
        });
        return { get, set };
    });
};
