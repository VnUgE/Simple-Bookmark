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
import { defaultTo, first } from "lodash-es";
import { get } from "@vueuse/core";
import { ref } from "vue";
import { useFormToaster } from "../toast";
//Wrapper around a Vuelidate validator
const createVuelidateWrapper = (validator) => {
    const validate = () => __awaiter(void 0, void 0, void 0, function* () {
        return get(validator).$validate();
    });
    const firstError = () => {
        var _a;
        const errs = get(validator).$errors;
        return new Error((_a = first(errs)) === null || _a === void 0 ? void 0 : _a.$message);
    };
    return { validate, firstError };
};
const createValidator = (validator, toaster) => {
    const validate = () => __awaiter(void 0, void 0, void 0, function* () {
        // Validate the form
        const valid = yield get(validator).validate();
        // If the form is no valid set the error message
        if (!valid) {
            const first = get(validator).firstError();
            // Set the error message to the first error in the form list
            toaster.notifyError(first.message);
        }
        return valid;
    });
    return { validate };
};
/**
 * Wraps a validator with a toaster to display validation errors
 * @param validator The validator to wrap
 * @param toaster The toaster to use for validation errors
 * @returns The validation toast wrapper
 * @example returns { validate: Function<Promise<boolean>> }
 * const { validate } = useValidationWrapper(validator, toaster)
 * const result = await validate()
 */
export const useValidationWrapper = (validator, toaster) => {
    return createValidator(validator, toaster !== null && toaster !== void 0 ? toaster : useFormToaster());
};
/**
 * Wraps a Vuelidate validator with a toaster to display validation errors
 * @param validator The vuelidate instance to wrap
 * @param toaster The toaster to use for validation errors
 * @returns The validation toast wrapper
 * @example returns { validate: Function<Promise<boolean>> }
 * const { validate } = useValidationWrapper(validator, toaster)
 * const result = await validate()
 */
export const useVuelidateWrapper = (v$, toaster) => {
    const wrapper = createVuelidateWrapper(v$);
    //Vuelidate class wrapper around the validator
    const validator = ref(wrapper);
    return createValidator(validator, defaultTo(toaster, useFormToaster()));
};
