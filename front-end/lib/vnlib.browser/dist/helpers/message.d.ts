import type { IErrorNotifier } from "../toast";
/**
 * The message handler interface
 */
export interface IMessageHandler {
    setMessage(title: string, text?: string): void;
    clearMessage(): void;
    onInput(): void;
}
/**
 * Gets the message state subsystem for displaying errors
 * to the user and clearing them
 * @param notifier An optional notifier to use instead of the default
 */
export declare const useMessage: (notifier?: IErrorNotifier) => IMessageHandler;
