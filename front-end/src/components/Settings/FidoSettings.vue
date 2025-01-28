<script setup lang="ts">
import {
    useFormToaster,
    usePassConfirm,
    useConfirm,
    useVuelidateWrapper,
    type IFidoDevice,
    type VuelidateInstance,
    useFidoApi,
} from '@vnuge/vnlib.browser'
import { computed, reactive, type Ref } from 'vue'
import { useStore } from '../../store'
import { useToggle, whenever, refDefault, toRefs } from '@vueuse/core'
import { useVuelidate } from '@vuelidate/core'
import { maxLength, minLength, helpers, required } from '@vuelidate/validators'

const store = useStore()
const { elevatedApiCall } = usePassConfirm()
const { reveal } = useConfirm()
const { error, close: closeToaster } = useFormToaster()

const isServerSupported = store.mfa.isSupported('fido')
const fido = useFidoApi(store.mfa)

const fidoSlot = store.mfa.getDataFor<{
    devices: IFidoDevice[],
    can_add_devices: boolean,
    data_size: number,
    max_size: number
}>('fido')
const fidoData = refDefault(fidoSlot, { devices: [], can_add_devices: true, data_size: 0, max_size: 0 })
const { devices, can_add_devices, data_size, max_size } = toRefs(fidoData)

const [isOpen, toggleOpen] = useToggle()

const refresh = () => store.mfa.refresh()

const vState = reactive({ deviceName: '' })
const rules = computed(() => {
    return {
        deviceName: {
            notEmpty: helpers.withMessage('Device name is required', required),
            alphaNumOnly: helpers.withMessage('Device name must be alphanumeric', helpers.regex(/^[a-zA-Z0-9\s]+$/)),
            minLength: helpers.withMessage('Device name must be at least 1 characters', minLength(1)),
            maxLength: helpers.withMessage('Device name must have less than 32 characters', maxLength(32))
        }
    }
})

const v$ = useVuelidate(rules, vState)
const { validate } = useVuelidateWrapper(v$ as Ref<VuelidateInstance>)

const onRemoveDevice = async (single: IFidoDevice) => {
    const { isCanceled } = await reveal({
        title: 'Are you sure?',
        text: `This will remove key ${single.n} from your account.`
    })
    if (isCanceled) {
        return;
    }

    await elevatedApiCall(async ({ toaster, password }) => {

        const text = await fido.disableDevice(single, { password });

        toaster.general.info({ title: 'Success', text })

        //Refresh the status
        refresh();
    })
}

const onDisable = async () => {
    const { isCanceled } = await reveal({
        title: 'Are you sure?',
        text: 'This will disable fido authentication for your account.'
    })
    if (isCanceled) {
        return;
    }

    await elevatedApiCall(async ({ toaster, password }) => {
        const { result } = await fido.disableAllDevices({ password });

        toaster.general.success({ title: 'FIDO disabled', text: result })

        //Refresh the status
        refresh()
    });
}

const onRegisterDevice = async () => {

    if (!isServerSupported.value) {
        error({ title: "Your browser does not support FIDO authentication." })
        return;
    }

    const isValid = await validate()
    if (!isValid) {
        return;
    }

    toggleOpen(false);

    const result = await elevatedApiCall(async ({ toaster, password }) => {

        const text = await fido.registerDefaultDevice(v$.value.deviceName.$model, { password });

        toaster.general.info({ title: 'Device registered', text })

        return true;
    })

    //Reopen the dialog if the result is not successful
    if (!result) {
        toggleOpen(true);
        return;
    }

    v$.value.deviceName.$model = '';
    v$.value.$reset();
    refresh();
}

const getAlgNameFromCode = (code: number) => {
    switch (code) {
        case -7:
            return "ES256";
        case -35:
            return "ES384";
        case -36:
            return "ES512";
        default:
            return "Unknown";
    }
}

//When the form opens, clear the device name
whenever(isOpen, () => {
    v$.value.deviceName.$model = '';
    v$.value.$reset();
})

</script>

<template>

    <div class="hidden" v-if="!isServerSupported">
        <!-- Fido is disabled by the server -->
    </div>

    <div v-else class="">

        <div class="flex flex-row gap-3 justify-between">
            <h3 class="text-xl font-bold">Webauthn</h3>

            <div class="ml-auto">

                <button v-if="fido.isSupported()" :disabled="!can_add_devices" type="button" class="btn blue me-2 disabled:cursor-not-allowed" @click.prevent="toggleOpen(true)">
                    <div class="flex flex-row items-center gap-1.5">
                        Enroll
                    </div>
                </button>
                <button v-if="devices?.length > 0" type="button" class="btn red" @click.prevent="onDisable">
                    <div class="flex flex-row items-center gap-1.5">
                        Disable
                    </div>
                </button>
            </div>
        </div>
        <div class="relative mt-4 overflow-x-auto shadow-md sm:rounded">
            <table class="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-2">
                            Device Name
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Device Id
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Algorithm
                        </th>
                        <th scope="col" class="px-4 py-2">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="device in devices" :key="device.id"
                        class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {{ device.n }}
                        </th>
                        <td class="px-4 py-3">
                            <div class="truncate max-w-40">
                                {{ device.id }}
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            {{ getAlgNameFromCode(device.alg) }}
                        </td>
                        <td class="px-4 py-3">
                            <button @click.prevent="onRemoveDevice(device)"
                                class="font-medium text-red-600 dark:text-red-500 hover:underline">
                                Remove
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

        </div>

        <div class="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
            <span class="mt-1">Data size: {{ data_size }}/{{ max_size }} b</span>
        </div>

        <p class="p-3 text-sm text-gray-500 rtl:text-right dark:text-gray-400">

        </p>

        <Dialog :open="isOpen" title="Add Key" @cancel="toggleOpen(false)">
            <template #body>
                <div class="p-4">
                    <form class="py-2 mt-3" id="fido-add-device-form" @submit.prevent="onRegisterDevice()">

                        <fieldset>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                You are about to enroll a new WebAuthn or Fido device for 2FA authentication to secure 
                                your account. 
                            </p>
                            <label for="device-name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Device name
                            </label>
                            <input type="text" v-model="v$.deviceName.$model" @input="closeToaster()" :class='{
                                    "dirty": v$.deviceName.$dirty,
                                    "data-invalid": v$.deviceName.$invalid
                                }'
                                class="block w-full text-sm text-gray-900 border border-gray-300 rounded bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="My YubiKey..." />
                            <p v-if="v$.deviceName.$errors.length > 0 && v$.deviceName.$model?.length > 0"
                                class="mt-1 ml-1 text-xs text-red-500">
                                {{ v$.deviceName.$errors[0].$message }}
                            </p>
                        </fieldset>

                        <div class="flex justify-end mt-3 row">
                            <button class="btn blue" @click="onRegisterDevice">Add Key</button>
                        </div>

                    </form>

                </div>
            </template>
        </Dialog>
    </div>
</template>
