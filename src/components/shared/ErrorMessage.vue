<template>
  <div class="rounded-lg border border-red-200 bg-red-50 p-4">
    <div class="flex items-start gap-3">
      <svg
        class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-red-700">{{ message }}</p>
        <button
          v-if="showRetry"
          class="mt-2 btn-secondary text-xs"
          @click="$emit('retry')"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
  showRetry: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['retry'])
</script>
