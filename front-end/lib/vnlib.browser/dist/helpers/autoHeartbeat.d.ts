import { type Ref } from "vue";
import { type MaybeRef } from "@vueuse/core";
export interface IAutoHeartbeatControls {
    /**
     * The current state of the heartbeat interval
     */
    enabled: Ref<boolean>;
    /**
     * Enables the hearbeat interval if configured
     */
    enable: () => void;
    /**
     * Disables the heartbeat interval
     */
    disable: () => void;
}
/**
* Configures shared controls for the heartbeat interval
* @param enabled The a reactive value that may be used to enable/disable the heartbeat interval
*/
export declare const useAutoHeartbeat: (interval: Readonly<MaybeRef<number>>, enabled: MaybeRef<boolean>) => IAutoHeartbeatControls;
