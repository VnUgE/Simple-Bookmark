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
import { MaybeRef, computed, shallowRef, watch } from 'vue';
import { apiCall, useAxios } from '@vnuge/vnlib.browser';
import { get, set, useToggle } from '@vueuse/core';
import { PiniaPlugin, PiniaPluginContext, storeToRefs } from 'pinia'
import { map, sortBy, isArray, defer } from 'lodash-es';

export interface OAuth2Application {
    readonly Id: string,
    readonly name: string,
    readonly description: string,
    readonly permissions: string[],
    readonly client_id: string,
    Created: Date,
    readonly LastModified: Date,
}

export interface NewAppResponse {
    readonly secret: string
    readonly app: OAuth2Application
}

export interface OAuth2Api {
    create(app: OAuth2Application): Promise<NewAppResponse>
    updateSecret(app: OAuth2Application, password: string): Promise<string>
    updateMeta(app: OAuth2Application): Promise<void>
    deleteApp(app: OAuth2Application, password: string): Promise<void>
}

declare module 'pinia' {
    export interface PiniaCustomProperties {
        oauth2:{
            apps: OAuth2Application[],
            scopes: string[],
            refresh(): void
        } & OAuth2Api
    }
}

export const oauth2AppsPlugin = (o2EndpointUrl: MaybeRef<string>, scopeEndpoint: MaybeRef<string>): PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const axios = useAxios(null);
        const { loggedIn } = storeToRefs(store)

        const [onRefresh, refresh] = useToggle()

        const _oauth2Apps = shallowRef<OAuth2Application[]>([])
        const scopes = shallowRef<string[]>([])

        /**
        * Updates an Oauth2 application's metadata
        */
        const updateMeta = async (app: OAuth2Application): Promise<void> => {
            //Update the app metadata
            await axios.put(get(o2EndpointUrl), app)
        }

        /**
         * Gets all of the user's oauth2 applications from the server
         * @returns The user's oauth2 applications
         */
        const getApps = async () => {
            // Get all apps
            const { data } = await axios.get<OAuth2Application[]>(get(o2EndpointUrl));

            if (!isArray(data)) {
                throw new Error("Invalid response from server")
            }

            return map(data, (appData) => {
                //Store the created time as a date object
                appData.Created = new Date(appData?.Created ?? 0)
                //create a new state manager for the user's profile
                return appData;
            })
        }

        /**
         * Creates a new application from the given data
         * @param param0 The application server buffer
         * @returns The newly created application
         */
        const create = async ({ name, description, permissions }: OAuth2Application): Promise<NewAppResponse> => {

            // make the post request, response is the new app data with a secret
            const { data } = await axios.post<OAuth2Application & { raw_secret: string }>(`${get(o2EndpointUrl)}?action=create`, { name, description, permissions })

            // Store secret
            const secret = data.raw_secret

            // remove secre tfrom the response
            delete (data as any).raw_secret

            return { secret, app: data }
        }

        /**
         * Requets a new secret for an application from the server
         * @param app The app to request a new secret for
         * @param password The user's password
         * @returns The new secret
         */
        const updateSecret = async (app: OAuth2Application, password: string): Promise<string> => {
            const { data } = await axios.post(`${o2EndpointUrl}?action=secret`, { Id: app.Id, password })
            return data.raw_secret
        }

        /**
         * Deletes an application from the server
         * @param app The application to delete
         * @param password The user's password
         * @returns The response from the server
         */
        const deleteApp = async (app: OAuth2Application, password: string): Promise<void> => {
            await axios.post(`${o2EndpointUrl}?action=delete`, { password, Id: app.Id });
        }

        const apps = computed(() => sortBy(_oauth2Apps.value, a => a.Created))

        watch([loggedIn, onRefresh], async ([li]) => {
            if (!li) {
                set(_oauth2Apps, [])
                return;
            }

            //Load the user's oauth2 apps after scopes load. to make sure the plugin is enabled
            apiCall(async () => {
                try {
                    //Load the oauth2 scopes
                    const { data } = await axios.get<string[]>(get(scopeEndpoint))
                    set(scopes, data)

                    _oauth2Apps.value = await getApps();
                }
                catch (e: any) {
                    if (e.response?.status === 404) {
                        console.warn("OAuth2 plugin is not configured");
                    }
                }
            })
        })

        defer(refresh)

        return {
            oauth2:{
                scopes,
                apps,
                deleteApp,
                updateSecret,
                updateMeta,
                create,
                refresh
            }
        }
    }
}