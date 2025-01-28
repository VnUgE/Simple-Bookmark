import { type Ref } from "vue";
export interface IWaitSingal {
    /**
     * The waiting flag ref (readonly)
     */
    readonly waiting: Readonly<Ref<boolean>>;
    /**
     * Sets the waiting flag to the value passed in
     * @param waiting The value to set the waiting flag to
     */
    setWaiting(waiting: boolean): void;
}
export declare const useWait: () => IWaitSingal;
