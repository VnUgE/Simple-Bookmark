import type { WebMessage } from '../types';
export interface RpcMethodArgs {
    /**
     * The json rpc version to use for the request
     */
    readonly version: '1.0.0' | '2.0.0';
    /**
     * The endpoint to send the request to
     */
    endpoint(): string;
}
export interface RpcClient<TMethod extends string> {
    /**
     * Sends a notification to the server
     * @param method The method to send
     * @param data The data to send with the method
     */
    notify(method: TMethod, data?: object): Promise<any>;
    /**
     * Sends a request to the server
     * @param method The method to send
     * @param data The data to send with the method
     */
    request<T extends WebMessage>(method: TMethod, data?: object): Promise<T>;
}
/**
 * Creates a json rpc client for the specified endpoint
 * @param args The arguments to create the client with
 * @returns A json rpc client
 */
export declare const useJrpc: <TMethod extends string>(args: RpcMethodArgs) => RpcClient<TMethod>;
