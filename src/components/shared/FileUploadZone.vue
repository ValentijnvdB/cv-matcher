<template>
  <div
    class="relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-150 cursor-pointer"
    :class="isDragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="triggerInput"
  >
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      @change="onInputChange"
    />

    <svg
      class="mx-auto h-10 w-10 text-gray-300 mb-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>

    <p class="text-sm font-medium text-gray-700">
      {{ label || 'Drag & drop or click to upload' }}
    </p>
    <p class="text-xs text-gray-400 mt-1">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  accept: {
    type: String,
    default: '.txt,.pdf,.png,.jpg,.jpeg',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: 'TXT, PDF, PNG, JPG',
  },
})

const emit = defineEmits(['files'])

const inputRef = ref(null)
const isDragging = ref(false)

function triggerInput() {
  inputRef.value?.click()
}

function onInputChange(e) {
  const files = Array.from(e.target.files)
  if (files.length) {
    emit('files', files)
    e.target.value = '' // reset so same file can be re-uploaded
  }
}

function onDrop(e) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  if (files.length) {
    emit('files', files)
  }
}
</script>
