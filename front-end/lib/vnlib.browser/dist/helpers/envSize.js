// Copyright (c) 2024 Vaughn Nugent
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
import { toSafeInteger } from 'lodash-es';
import { ref, computed } from "vue";
import { useElementSize } from '@vueuse/core';
/**
 * Setups a common state for the environment size
 */
export const useEnvSize = (() => {
    //Element refs for app to watch
    const header = ref(null);
    const footer = ref(null);
    const content = ref(null);
    //Setup reactive element sizes
    const headerSize = useElementSize(header);
    const footerSize = useElementSize(footer);
    const contentSize = useElementSize(content);
    const footerHeight = computed(() => toSafeInteger(footerSize.height.value));
    const headerHeight = computed(() => toSafeInteger(headerSize.height.value));
    const contentHeight = computed(() => toSafeInteger(contentSize.height.value - headerSize.height.value - footerSize.height.value));
    return (exportElements) => {
        return exportElements ?
            { footerHeight, headerHeight, contentHeight, header, footer, content } :
            { footerHeight, headerHeight, contentHeight };
    };
})();
