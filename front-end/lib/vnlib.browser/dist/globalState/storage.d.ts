import { type Ref } from 'vue';
import { type StorageLike } from '@vueuse/core';
export interface ReactiveStorageLike extends StorageLike {
    onStorageChanged: (key: string, callback: () => void) => void;
}
export declare const toReactive: (storage: Ref<StorageLike | undefined>) => ReactiveStorageLike;
export declare const createStorageRef: <T>(backend: ReactiveStorageLike, key: string, defaultValue: T) => Ref<T>;
