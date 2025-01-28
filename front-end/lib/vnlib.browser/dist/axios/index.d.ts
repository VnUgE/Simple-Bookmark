import { type Axios, type AxiosRequestConfig } from 'axios';
/**
 * Gets a reactive axios instance with the default configuration
 * @param config Optional Axios instance configuration to apply, will be merged with the default config
 * @returns A reactive ref to an axios instance
 */
export declare const useAxios: (config?: AxiosRequestConfig | undefined | null) => Axios;
