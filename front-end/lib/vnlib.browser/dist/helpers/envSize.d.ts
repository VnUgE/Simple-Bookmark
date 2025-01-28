/**
 * Setups a common state for the environment size
 */
export declare const useEnvSize: (exportElements?: boolean) => {
    footerHeight: import("vue").ComputedRef<number>;
    headerHeight: import("vue").ComputedRef<number>;
    contentHeight: import("vue").ComputedRef<number>;
    header: import("vue").Ref<null, null>;
    footer: import("vue").Ref<null, null>;
    content: import("vue").Ref<null, null>;
} | {
    footerHeight: import("vue").ComputedRef<number>;
    headerHeight: import("vue").ComputedRef<number>;
    contentHeight: import("vue").ComputedRef<number>;
    header?: undefined;
    footer?: undefined;
    content?: undefined;
};
