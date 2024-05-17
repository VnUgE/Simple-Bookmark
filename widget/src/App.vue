<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore, TabId } from './store';
import { computed, defineAsyncComponent } from 'vue';
import { isEqual } from 'lodash-es';
import { useDark } from '@vueuse/core';

const store = useStore();
const {  } = storeToRefs(store);
const darkMode = useDark()

</script>

<template>
  <head>
    <title>Simple Bookmark Wiget</title>
  </head>
  <body>
    
  </body>
</template>