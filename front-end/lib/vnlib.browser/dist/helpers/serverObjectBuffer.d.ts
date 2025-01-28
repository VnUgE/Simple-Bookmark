import { type UnwrapNestedRefs, type Ref } from 'vue';
/**
 * Represents a server object that has been buffered for editing
 * and can be reverted to the original state, or new state data
 * applied from the server
 */
export interface ServerObjectBuffer<T> {
    /**
      * The data is a reactive clone of the initial data state. It is used to store the current state of the resource.
      */
    readonly data: UnwrapNestedRefs<T>;
    /**
     * The buffer is a reactive clone of the initial data state. It is used to track changes.
     */
    readonly buffer: UnwrapNestedRefs<T>;
    /**
     * A computed value that indicates if the buffer has been modified from the data
     */
    readonly modified: Readonly<Ref<boolean>>;
    /**
    * Applies the new server response data to the resource data and reverts the buffer to the resource data
    * @param newData The new server response data to apply to the buffer
    */
    apply(newData: T): void;
    /**
     * Reverts the buffer to the resource data
     */
    revert(): void;
}
export type UpdateCallback<T, TResut> = (state: ServerObjectBuffer<T>) => Promise<TResut>;
/**
 * Represents a server object that has been buffered for editing
 * and can be reverted to the original state or updated on the server
 */
export interface ServerDataBuffer<T, TResut> extends ServerObjectBuffer<T> {
    /**
     * Pushes buffered changes to the server if configured
     */
    update(): Promise<TResut>;
}
export interface UseDataBuffer {
    /**
     * Configures a helper type that represents a data buffer that reflects the state of a resource
     * on the server. This is useful for editing forms, where the user may want to revert their
     * changes, or reload them from the server after an edit;
     * @param initialData The intiial data to wrap in the buffer
     * @returns
     */
    <T extends object>(initialData: T): ServerObjectBuffer<T>;
    /**
     * Configures a helper type that represents a data buffer that reflects the state of a resource
     * on the server. This is useful for editing forms, where the user may want to revert their
     * changes, or reload them from the server after an edit;
     * @param initialData
     * @returns
     */
    <T extends object, TState = unknown>(initialData: T, onUpdate: UpdateCallback<T, TState>): ServerDataBuffer<T, TState>;
}
/**
 * Cretes a buffer object that represents server data, tracks changes,
 * can revert changes, and can optionally push buffered changes to the server
 */
export declare const useDataBuffer: UseDataBuffer;
