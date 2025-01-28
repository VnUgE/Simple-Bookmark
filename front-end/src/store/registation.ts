// Copyright (C) 2025 Vaughn Nugent
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
import { WebMessage, useAccountRpc } from '@vnuge/vnlib.browser';
import { PiniaPluginContext, PiniaPlugin } from 'pinia'
import { storeExport, type TabName } from '.';

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

type AdminRpcCommands = 'sb.admin' | 'sb.admin.invite' | 'sb.admin.register'

export const registationPlugin = (): PiniaPlugin => {
    
    const { exec } = useAccountRpc<AdminRpcCommands>()

    const createSignupLink = async (username: string, hasAddPerms: boolean): Promise<SignupToken> => {
        const { getResultOrThrow } = await exec('sb.admin.invite', { username, can_add_users: hasAddPerms })

        const token = getResultOrThrow();

        return { link: `${window.location.origin}?tab=${'register' as TabName}&token=${token}` }
    }

    const completeRegistation = (token: string, password: string): Promise<WebMessage<string>> => {
        return exec<string>('sb.admin.register', { token, password })
    }

    const registerAdmin = async (username: string, password: string): Promise<WebMessage<string>> => {
        return exec<string>('sb.admin.register', { admin_username:username, password })
    }

    return ({ store }: PiniaPluginContext): any => {

        const status = store.account.getPropertyData<RegistationStatus | undefined>('sb.admin', undefined);

        return storeExport({
            registation: {
                status,
                api: {
                    createSignupLink,
                    completeRegistation,
                    registerAdmin
                }
            }
        });
    }
}