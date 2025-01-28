import { type Ref } from 'vue';
export interface CookieMonitor<T> {
    readonly cookieValue: Readonly<Ref<T>>;
    readonly enabled: Readonly<Ref<boolean>>;
}
export type CookieValueConveter<T> = (value: string) => T;
/**
 * Creates a reactive wrapper that monitors a single cookie value for changes
 * @param enabled A ref that indicates if the cookie should be monitored
 * @param cookieName The name of the cookie to monitor
 * @param converter An optional converter function to convert the cookie value to a different type
 */
export declare const createCookieMonitor: <T = string>(enabled: Ref<boolean>, cookieName: Ref<string | undefined>, converter?: CookieValueConveter<T>) => CookieMonitor<T>;
