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


//Get the create app from boostrap dir
import { configureApi } from '@vnuge/vnlib.browser'
import { createApp } from "vue";
import { useDark } from "@vueuse/core";
import { createPinia } from "pinia";
import { oauth2AppsPlugin } from './store/oauthAppsPlugin'

import App from './App.vue'
//Import your main style file
import './index.scss'

import { profilePlugin } from './store/userProfile'
import { mfaSettingsPlugin } from './store/mfaSettingsPlugin'
import { socialMfaPlugin } from './store/socialMfaPlugin'
import { bookmarkPlugin } from './store/bookmarks'
import { registationPlugin } from './store/registation';
import { siteLookupPlugin } from './store/websiteLookup';

//Setup the vnlib api
configureApi({
    axios: {
        //The base url to make api requests against
        baseURL: import.meta.env.VITE_API_URL,
        withCredentials: import.meta.env.VITE_CORS_ENABLED === 'true',
    },
    storage: localStorage
})

//Import vuetify stuff

const store = createPinia();

//Enable dark mode support
useDark({
    selector: 'html',
    valueDark: 'dark',
    valueLight: 'light',
});

createApp(App)
    .use(store)         //Add pinia to the app
    .mount('#app')      //Mount the app to the #app element