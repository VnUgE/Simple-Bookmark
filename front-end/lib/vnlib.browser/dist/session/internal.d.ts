import { type AsyncStorageItem, type ReadonlyManualRef } from '../storage';
import type { ISession, SessionConfig } from './types';
import type Cookies from 'universal-cookie';
export interface IStateStorage {
    token: string | null;
    browserId: string | null;
}
export interface IKeyStorage {
    priv: string | null;
    pub: string | null;
}
export declare const createSession: (config: ReadonlyManualRef<SessionConfig>, keyStorage: AsyncStorageItem<IKeyStorage>, state: AsyncStorageItem<IStateStorage>, cookies: Cookies) => ISession;
