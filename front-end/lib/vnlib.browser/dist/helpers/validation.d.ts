import { type MaybeRef } from "vue";
import type { IErrorNotifier } from "../toast";
/**
 * Represents a validator that performs validation and returns a boolean
 * along with an error message if the validation fails
 */
export interface IValidator {
    /**
     * Performs asynchronous validation and returns a boolean
     * indicating if the validation was successful
     */
    validate(): Promise<boolean>;
    /**
     * Returns the first error message in the validation list
     */
    firstError(): Error;
}
export interface ValidationWrapper {
    /**
     * Computes the validation of the wrapped validator and captures the results.
     * If the validation fails, the first error message is displayed in a toast notification.
     * @returns The result of the validation
     */
    validate: () => Promise<boolean>;
}
export interface VuelidateInstance {
    $validate: () => Promise<boolean>;
    $errors: Array<{
        $message: string;
    }>;
}
/**
 * Wraps a validator with a toaster to display validation errors
 * @param validator The validator to wrap
 * @param toaster The toaster to use for validation errors
 * @returns The validation toast wrapper
 * @example returns { validate: Function<Promise<boolean>> }
 * const { validate } = useValidationWrapper(validator, toaster)
 * const result = await validate()
 */
export declare const useValidationWrapper: <T extends IValidator>(validator: Readonly<MaybeRef<T>>, toaster?: IErrorNotifier) => ValidationWrapper;
/**
 * Wraps a Vuelidate validator with a toaster to display validation errors
 * @param validator The vuelidate instance to wrap
 * @param toaster The toaster to use for validation errors
 * @returns The validation toast wrapper
 * @example returns { validate: Function<Promise<boolean>> }
 * const { validate } = useValidationWrapper(validator, toaster)
 * const result = await validate()
 */
export declare const useVuelidateWrapper: <T extends VuelidateInstance>(v$: Readonly<MaybeRef<T>>, toaster?: IErrorNotifier) => ValidationWrapper;
