import 'pinia'
import { computed, watch } from 'vue';
import { 
    type ServerDataBuffer, 
    type ServerObjectBuffer, 
    type UserProfile, 
    type WebMessage, 
    apiCall,
    useDataBuffer, 
    useAccount, 
    useAccountRpc
} from '@vnuge/vnlib.browser';
import { syncRef, useToggle } from '@vueuse/core';
import { PiniaPlugin, PiniaPluginContext, storeToRefs } from 'pinia'
import { defer } from 'lodash-es';
import { storeExport } from './index';

export interface OAuth2Application {
    readonly Id: string,
    readonly name: string,
    readonly description: string,
    readonly permissions: string[],
    readonly client_id: string,
    readonly Created: Date,
    readonly LastModified: Date,
}

export interface NewAppResponse {
    readonly secret: string
    readonly app: ServerDataBuffer<OAuth2Application, WebMessage<string>>
}

interface ExUserProfile extends UserProfile {
    created: string | Date
}

export interface UserProfileStore{
    readonly userProfile: ServerDataBuffer<ExUserProfile, WebMessage<string>>
    refreshProfile(): void;
}

declare module 'pinia' {
    export interface PiniaCustomProperties extends UserProfileStore {
    }
}

export const profilePlugin = () :PiniaPlugin => {

    return ({ store }: PiniaPluginContext): UserProfileStore => {

        const { loggedIn, userName } = storeToRefs(store)
        const { getProfile } = useAccount()
        const { exec } = useAccountRpc()

        const [onRefresh, refreshProfile] = useToggle()

        const updateUserProfile = async (profile: ServerObjectBuffer<ExUserProfile>) => {
            // Apply the buffer to the profile
            const data = await exec<string>('profile.update', profile.buffer)

            //Get the new profile from the server
            const newProfile = await getProfile() as ExUserProfile

            //Apply the new profile to the buffer
            profile.apply(newProfile)

            return data;
        }

        const userProfile = useDataBuffer({} as any, updateUserProfile)

        const loadProfile = async () => {
            //Get the user profile
            const profile = await getProfile() as ExUserProfile
            //Apply the profile to the buffer
            userProfile.apply(profile)
        }

        //If the user is logged in, load the profile buffer
        watch([loggedIn, onRefresh], ([li]) => li ? apiCall(loadProfile) : userProfile.apply({} as any))

        //sync global username value with profile email
        syncRef(userName, computed(() => userProfile.data.email), { direction: 'rtl' })

        return storeExport({
            userProfile,
            refreshProfile
        }) as unknown as UserProfileStore
    }
}