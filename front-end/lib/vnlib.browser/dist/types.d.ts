/**
 * Represents a uniform message from the server
 */
export interface WebMessage<T = unknown> {
    /**
     * The result of the operation, or an error message
     * if the sucess value is false
     */
    readonly result: T | string;
    /**
     * True if the operation was successful, false otherwise
     */
    readonly success: boolean;
    /**
     * Validation errors, if any occured
     */
    readonly errors?: ServerValidationError[];
    /**
     * Returns the result, or throws an error if the operation was not successful
     */
    getResultOrThrow(): T;
}
/**
 * Represents a validation error from the server for a specific property
 */
export interface ServerValidationError {
    /**
     * The property that failed validation
     */
    readonly property: string;
    /**
     * The error message
     */
    readonly message: string;
}
