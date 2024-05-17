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

import { toRefs, set, watchDebounced, useLocalStorage } from "@vueuse/core";
import { toSafeInteger, toString, defaults } from "lodash-es";
import { defineStore } from "pinia";
import { computed, shallowRef, watch } from "vue";


/**
 * Loads the main store for the application
 */
export const useStore = defineStore('main', () => {

    return{
  
    }
})
