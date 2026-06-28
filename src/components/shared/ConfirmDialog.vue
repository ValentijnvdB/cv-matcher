<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('cancel')"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h3 v-if="title" class="text-base font-semibold text-gray-900 mb-2">
            {{ title }}
          </h3>
          <p class="text-sm text-gray-600 mb-6">
            <slot>{{ message }}</slot>
          </p>
          <div class="flex items-center justify-end gap-2">
            <button class="btn-secondary" @click="$emit('cancel')">
              {{ cancelLabel }}
            </button>
            <button :class="danger ? 'btn-danger' : 'btn-primary'" @click="$emit('confirm')">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: 'Are you sure?' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  danger: { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'confirm', 'cancel'])
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
