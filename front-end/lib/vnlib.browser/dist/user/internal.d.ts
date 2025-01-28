import { type Ref } from "vue";
import type { Axios } from "axios";
import type { ISession } from '../session';
import type { User, UserConfig, UserState } from './types';
export declare enum AccountEndpoint {
    Login = "login",
    Logout = "logout",
    Register = "register",
    Reset = "reset",
    Profile = "profile",
    HeartBeat = "keepalive"
}
export interface IUserInternal extends User {
    getEndpoint: (endpoint: AccountEndpoint) => string;
}
export declare const createUser: (config: Readonly<Ref<UserConfig>>, axios: Readonly<Ref<Axios>>, session: ISession, state: Ref<UserState>) => IUserInternal;
