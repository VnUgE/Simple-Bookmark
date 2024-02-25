// Copyright (C) 2024 Vaughn Nugent
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import 'pinia'
import { MaybeRef, shallowRef, watch } from 'vue';
import { WebMessage, useAxios } from '@vnuge/vnlib.browser';
import { get } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { defer } from 'lodash-es';
import { TabId } from '.';

export interface SignupToken {
    readonly link: string
}

export interface RegistationStatus{
    readonly setup_mode: boolean
    readonly enabled: boolean
    readonly can_invite: boolean
    readonly link_expiration: number
}

export interface UserRegistationApi {
    createSignupLink(username: string, canAddUsers: boolean): Promise<SignupToken>
    getStatus(): Promise<RegistationStatus>
    registerAdmin(username: string, password: string): Promise<WebMessage<string>>
    completeRegistation(token: string, password: string): Promise<WebMessage<string>>
}

declare module 'pinia' {
    export interface PiniaCustomProperties {
       registation:{
            api: UserRegistationApi
            status: RegistationStatus | undefined
       }
    }
}


const useRegApi = (endpoint: MaybeRef<string>): UserRegistationApi => {

    const axios = useAxios(null);

    const createSignupLink = async (username: string, hasAddPerms: boolean): Promise<SignupToken> => {
        const { data } = await axios.put<WebMessage<string>>(get(endpoint), { 
            username, 
            can_add_users:hasAddPerms 
        })

        const token = data.getResultOrThrow();

        return { link: `${window.location.origin}?tab=${TabId.Register}&token=${token}` }
    }

    const getStatus = async (): Promise<RegistationStatus> => {
        const { data } = await axios.get<WebMessage<RegistationStatus>>(get(endpoint))
        return data.getResultOrThrow();
    }

    const completeRegistation = async (token: string, password: string): Promise<WebMessage<string>> => {
        const { data } = await axios.post<WebMessage<string>>(get(endpoint), { token, password })
        return data;
    }

    const registerAdmin = async (username: string, password: string): Promise<WebMessage<string>> => {
        const { data } = await axios.post<WebMessage<string>>(get(endpoint), { admin_username:username, password })
        return data;
    }

    return {
        createSignupLink,
        getStatus,
        completeRegistation,
        registerAdmin
    }
}

export const registationPlugin = (regEndpoint: MaybeRef<string>): PiniaPlugin => {

    return ({ store }: PiniaPluginContext): any => {

        const { loggedIn } = storeToRefs(store)
      
        const regApi = useRegApi(regEndpoint)
        const status = shallowRef<RegistationStatus | undefined>()

        const getStatus = async () => status.value = await regApi.getStatus()

        watch(loggedIn, () => defer(getStatus), { immediate: true })

        return{
            registation: {
                api: regApi,
                status,
            }
        }
    }
}