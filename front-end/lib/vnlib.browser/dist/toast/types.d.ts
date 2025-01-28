export interface ToastEvent {
}
export interface IToaster {
    success(config: object): void;
    error(config: object): void;
    info(config: object): void;
    close(id?: string): void;
}
export interface INotifier {
    notify(config: object): void;
    close(id: string): void;
}
export interface IErrorNotifier {
    notifyError(title: string, message?: string): void;
    close(id?: string): void;
}
export interface ToasterNotifier extends IToaster, IErrorNotifier {
}
export interface CombinedToaster {
    readonly form: IToaster;
    readonly general: IToaster;
}
