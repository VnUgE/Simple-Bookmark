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
import { MaybeRef, shallowRef, watch, computed, Ref, ref } from 'vue';
import { apiCall, useAxios, WebMessage } from '@vnuge/vnlib.browser';
import { useToggle, get, set, useOffsetPagination, watchDebounced, syncRef } from '@vueuse/core';
import { PiniaPluginContext, PiniaPlugin, storeToRefs } from 'pinia'
import { isArray, join, map, split, sortBy } from 'lodash-es';
import { useQuery } from './index';

export interface Bookmark{
    readonly Id: string
    Name: string
    Url: string
    Tags: string[]
    Description: string
    Created: string
    LastModified: string
}

export interface BatchUploadResult{
    readonly invalid: BookmarkError[]
}

export interface BookmarkError{
    readonly subject: Bookmark
    readonly errors: Array<{
        readonly message: string
        readonly property: string
    }>
}

export interface BookmarkApi{
    list: (page: number, limit: number, search: BookmarkSearch) => Promise<Bookmark[]>
    add: (bookmark: Bookmark) => Promise<void>
    addMany: (bookmarks: Bookmark[], failOnValidationError: boolean) => Promise<BatchUploadResult | string>
    set: (bookmark: Bookmark) => Promise<void>
    getTags: () => Promise<string[]>
    delete: (bookmark: Bookmark | Bookmark[]) => Promise<void>
    count: () => Promise<number>
}

export interface BookmarkSearch{
    query: string | undefined | null
    tags: string[]
}

declare module 'pinia' {
    export interface PiniaCustomProperties {
        bookmarks:{
            api: BookmarkApi
            query: string
            tags: string[]
            allTags: string[]
            list: Bookmark[]
            pages: ReturnType<typeof useOffsetPagination>
            refresh: () => void
        }
    }
}

const useBookmarkApi = (endpoint: MaybeRef<string>): BookmarkApi => {

    const axios = useAxios(null)

    const listBookmarks = async (page: number, limit: number, search: BookmarkSearch) => {
        const query = get(search.query)
        const tagQuery = join(get(search.tags), ' ')

        const params = new URLSearchParams()
        params.append('page', (page - 1).toString())
        params.append('limit', limit.toString())
        params.append('t', tagQuery)

        //Add query if defined
        if(query){
            params.append('q', query)
        }
      
        const { data } = await axios.get<Bookmark[]>(`${get(endpoint)}?${params.toString()}`)
        return data;
    }

    const addBookmark = async (bookmark: Bookmark) => {
        const { data } = await axios.post<WebMessage>(`${get(endpoint)}`, bookmark)
        data.getResultOrThrow();
    }

    const setBookmark = async (bookmark: Bookmark) => {
        const { data } = await axios.patch<WebMessage<Bookmark>>(`${get(endpoint)}`, bookmark)
        data.getResultOrThrow();
    }

    const deleteBookmark = async (bookmark: Bookmark | Bookmark[]) => {
        if(isArray(bookmark)){
            //Delete multiple bookmarks with comma separated ids
            const bookmarIds = join(map(bookmark, b => b.Id), ',')
            const { data } = await axios.delete<WebMessage<Bookmark>>(`${get(endpoint)}?ids=${bookmarIds}`)
            data.getResultOrThrow();    
        }
        else {
            //Delete a single bookmark
            const { data } = await axios.delete<WebMessage<Bookmark>>(`${get(endpoint)}?id=${bookmark.Id}`)
            data.getResultOrThrow();
        }
    }

    const getItemsCount = async () => {
        const { data } = await axios.get<WebMessage<number>>(`${get(endpoint)}?count=true`)
        return data.getResultOrThrow();
    }

    const getTags = async () => {
        const { data } = await axios.get<string[]>(`${get(endpoint)}?getTags=true`)
        return sortBy(data);
    }

    const addMany = async (bookmarks: Bookmark[], failOnValidationError: boolean): Promise<BatchUploadResult | string> => {
        let params = '' 
        
        if(failOnValidationError){
            params = '?failOnInvalid=true'
        }

        //Exec request, ignore a validation error on a 20x response
        const { data } = await axios.put<WebMessage<BatchUploadResult>>(`${get(endpoint)}${params}`, bookmarks);
        return data.result;
    }

    return {
        list: listBookmarks,
        add: addBookmark,
        set: setBookmark,
        delete: deleteBookmark,
        count: getItemsCount,
        addMany,
        getTags
    }
}

const urlPagiation = (p: Ref<number>, l: Ref<number>) => {
    const page = useQuery('page')
    const limit = useQuery('limit')

    const currentPage = computed({
        get: () => page.value ? parseInt(page.value) : 1,
        set: (value) => set(page, value.toString())
    })

    const currentPageSize = computed({
        get: () => limit.value ? parseInt(limit.value) : 20,
        set: (value) => set(limit, value.toString())
    })

    //Sync current page and limit with the provided refs
    syncRef(currentPage, p, { immediate: true })
    syncRef(currentPageSize, l, { immediate: true })
}

const searchQuery = (search: Ref<string | null>, tags: Ref<string[]>) => {
    
    const query = useQuery('q')
    const tagQuery = useQuery('t')

    const currentTags = computed({
        get: () => split(tagQuery.value, ' '),
        set: (value) => set(tagQuery, join(value, ' '))
    })

    //Sync current page and limit with the provided refs
    syncRef(query, search, { immediate: true })
    syncRef(currentTags, tags, { immediate: true })
}

export const bookmarkPlugin = (bookmarkEndpoint: MaybeRef<string>): PiniaPlugin => {

    return ({ store }: PiniaPluginContext) => {

        const { loggedIn } = storeToRefs(store)
        const [onRefresh, refresh] = useToggle()

        const totalBookmarks = shallowRef(0)
        const bookmarks = shallowRef<Bookmark[]>()   
        const allTags = shallowRef<string[]>([])     

        const pages = useOffsetPagination({ page: 1, pageSize: 20 })
        const { currentPage, currentPageSize } = pages;
        //Sync url query params with the pagination
        urlPagiation(currentPage, currentPageSize)

        //sync search query and tags
        const query = ref<string | null>(null)
        const tags = ref<string[]>([])
        searchQuery(query, tags)

        //Init api
        const bookmarkApi = useBookmarkApi(bookmarkEndpoint)

        watch([loggedIn, onRefresh], ([ li ]) => {
            if(!li){
                //Clear the bookmarks
                set(totalBookmarks, 0)
                set(bookmarks, [])
                return
            }

            //Update the total bookmarks
            apiCall(async () => totalBookmarks.value = await bookmarkApi.count())
            apiCall(async () => allTags.value = await bookmarkApi.getTags())
        })

        //Watch for serach query changes
        watchDebounced([currentPage, currentPageSize, totalBookmarks, tags, query, allTags], 
            ([ page, pageSize, _, tags, query ]) => {
                apiCall(async () => bookmarks.value = await bookmarkApi.list(page, pageSize, { tags, query }))
        }, { debounce: 10 })

        //Watch for page changes and scroll to top
        watch([currentPage], () => window.scrollTo({ top: 0, behavior: 'smooth' }))

        //reset current page when tags change or query changes
        watch([tags, query], () => set(currentPage, 1))
        
        return {
            bookmarks:{
                list: bookmarks,
                pages,
                refresh,
                query,
                tags,
                allTags,
                api: bookmarkApi
            }
        }
    }
}