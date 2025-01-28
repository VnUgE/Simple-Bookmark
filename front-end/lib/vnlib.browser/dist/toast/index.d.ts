import { type MaybeRef } from 'vue';
import type { INotifier, CombinedToaster, ToasterNotifier } from './types';
export type * from './types';
/**
 * Configures the notification handler.
 * @param {*} notifier The method to call when a notification is to be displayed
 * @returns The notifier
 */
export declare const configureNotifier: (notifier: INotifier) => void;
/**
 * Gets the default toaster for general notifications
 * and the form toaster for form notifications
 * @returns {Object} The toaster contianer object
 */
export declare const useToaster: (notifier?: MaybeRef<INotifier>) => CombinedToaster;
/**
 * Gets the default toaster for from notifications
 */
export declare const useFormToaster: (notifier?: MaybeRef<INotifier>) => ToasterNotifier;
/**
 * Gets the default toaster for general notifications
 * @returns {Object} The toaster contianer object
 */
export declare const useGeneralToaster: (notifier?: MaybeRef<INotifier>) => ToasterNotifier;
