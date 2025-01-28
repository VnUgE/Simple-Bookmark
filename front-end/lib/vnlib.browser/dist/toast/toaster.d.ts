import type { MaybeRef } from 'vue';
import type { INotifier, ToasterNotifier } from './types';
export declare const createToaster: (notifier: MaybeRef<INotifier>, fallback: object) => ToasterNotifier;
/**
 * Creates a toaster for form notifications
 * @param notifier The send to write the notifications to
 * @returns A toaster to send form notifications to
 */
export declare const createFormToaster: (notifier: MaybeRef<INotifier>) => ToasterNotifier;
/**
 * The general toaster implementation of the IToaster interface
 */
export declare const createGeneralToaster: (notifier: MaybeRef<INotifier>) => ToasterNotifier;
