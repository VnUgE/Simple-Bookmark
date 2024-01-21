<script setup lang="ts">
import { configureNotifier } from '@vnuge/vnlib.browser';
import { get, set } from '@vueuse/core';
import { remove } from 'lodash-es';
import { ref } from 'vue';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification{
    id: string;
    title: string;
    text: string;
    type: NotificationType;
    duration?: number;
    dismiss: () => void;
}

const notifications = ref<Notification[]>([]);

const close = (id: string) => {
    const current = get(notifications);
    remove(current, n => n.id === id);
    set(notifications, current);
}

const notify = (notification: Partial<Notification>) => {
    const current = get(notifications);
    const id = Math.random().toString(36).substring(7);
    const newNotification = {
        id,
        title: notification.title ?? '',
        text: notification.text ?? '',
        type: notification.type ?? 'info',
        dismiss: () => close(id),
    }

    set(notifications, [newNotification, ...current]);

    //set timeout to close notification
    setTimeout(() => close(id), notification.duration || 7000);
}

//configure global notifier
configureNotifier({ notify, close })
</script>

<template>
    <ul id="toaster" class="">

        <li v-for="n in notifications" :key="n.id">
            <Transition :duration="100" appear-from-class="-mr-20" appear-to-class="mr-10">
                <div :id="n.id" class="alert" role="alert" :class="[n.type]">
                    <div class="flex items-center">
                        <svg class="flex-shrink-0 w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                        </svg>
                        <span class="sr-only">{{ n.type }}</span>
                        <h3 class="m-0 text-base font-medium">{{ n.title }}</h3>
                    </div>
                    <div v-if="n.text" class="mt-2 mb-2 text-sm">
                        {{ n.text }}
                    </div>
                    <div v-show="n.text"  class="flex justify-end">
                        <button @click.prevent="n.dismiss()" type="button" data-dismiss-target="#alert-additional-content-1"
                            aria-label="Close">
                            Dismiss
                        </button>
                    </div>
                </div>
            </Transition>
        </li>
    </ul>
</template>

<style lang="scss">
#toaster{
    .alert {
        @apply p-3 mb-4 border rounded;

        button {
            @apply bg-transparent border focus:ring-4 focus:outline-none font-medium rounded-lg text-xs px-3 py-1.5 text-center;
        }

        &.error {
            @apply text-red-800 border-red-300 dark:text-red-400 dark:border-red-800 bg-red-50 dark:bg-transparent;

            button {
                @apply text-red-800 border-red-800 hover:bg-red-900 hover:text-white focus:ring-red-300 dark:hover:bg-red-600 dark:border-red-600 dark:text-red-500 dark:hover:text-white dark:focus:ring-red-800
            }
        }

        &.success {
            @apply text-green-800 border-green-300 dark:text-green-400 dark:border-green-800 dark:bg-transparent bg-green-100;

            button {
                @apply text-green-800 border-green-800 hover:bg-green-900 hover:text-white focus:ring-green-300 dark:hover:bg-green-600 dark:border-green-600 dark:text-green-400 dark:hover:text-white dark:focus:ring-green-800;
            }
        }

        &.warning {
            @apply text-yellow-800 border-yellow-300 dark:text-yellow-300 dark:border-yellow-800 dark:bg-transparent bg-yellow-100;

            button {
                @apply text-yellow-800 border-yellow-800 hover:bg-yellow-900 hover:text-white focus:ring-yellow-300 dark:hover:bg-yellow-300 dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-gray-800 dark:focus:ring-yellow-800;
            }
        }

        &.info {
            @apply text-blue-800 border-blue-300 dark:text-blue-400 dark:border-blue-800 dark:bg-transparent bg-blue-100;

            button {
                @apply text-blue-800 border-blue-800 hover:bg-blue-900 hover:text-white focus:ring-blue-300 dark:hover:bg-blue-600 dark:border-blue-600 dark:text-blue-500 dark:hover:text-white dark:focus:ring-blue-800;
            }
        }
    }
}
</style>
