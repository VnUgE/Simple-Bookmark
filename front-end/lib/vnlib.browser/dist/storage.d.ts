export type AsyncStorageItem<T> = {
    [K in keyof T]: {
        /**
         * Gets the stored value of the slot asynchonously if necessary
         * @returns The value of the slot
         */
        get: () => Promise<T[K]>;
        /**
         * Sets the value of the slot
         * @param value The value to set the slot to
         */
        set: (value: T[K]) => Promise<void>;
    };
};
export interface ReadonlyManualRef<T> {
    get(): T;
    get<K extends keyof T>(propName: K): T[K];
    changed(): boolean;
}
export declare const manualComputed: <T extends object>(getter: () => T) => ReadonlyManualRef<T>;
export declare const createStorageSlot: <T extends object>(key: string, defaultValue: T) => AsyncStorageItem<T>;
