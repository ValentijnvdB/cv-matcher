<template>
  <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors group">
    <!-- Priority indicator dot -->
    <div class="w-2 h-2 rounded-full flex-shrink-0" :class="priorityDotClass" />

    <!-- Editable text -->
    <input
      v-model="localText"
      class="flex-1 min-w-0 text-sm text-gray-800 bg-transparent border-0 outline-none focus:ring-0 p-0"
      placeholder="Requirement text…"
      @blur="onTextBlur"
    />

    <!-- Priority dropdown -->
    <select
      v-model="localPriority"
      class="text-xs border border-gray-200 rounded-md py-1 pl-2 pr-6 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer flex-shrink-0"
      style="min-width: 90px"
      @change="onPriorityChange"
    >
      <option value="must">Must have</option>
      <option value="should">Should have</option>
      <option value="nice">Nice to have</option>
    </select>

    <!-- Delete button -->
    <button
      class="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
      title="Remove requirement"
      @click="showConfirm = true"
    >
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <ConfirmDialog
    v-model="showConfirm"
    title="Remove requirement?"
    :message="`Remove &quot;${requirement.text || 'this requirement'}&quot;?`"
    confirm-label="Remove"
    cancel-label="Cancel"
    danger
    @confirm="$emit('delete', requirement.id); showConfirm = false"
    @cancel="showConfirm = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const props = defineProps({
  requirement: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update', 'delete'])

const localText = ref(props.requirement.text)
const localPriority = ref(props.requirement.priority)
const showConfirm = ref(false)

function onTextBlur() {
  if (localText.value !== props.requirement.text) {
    emit('update', props.requirement.id, 'text', localText.value)
  }
}

function onPriorityChange() {
  emit('update', props.requirement.id, 'priority', localPriority.value)
}

const priorityDotClass = computed(() => {
  if (localPriority.value === 'must') return 'bg-red-400'
  if (localPriority.value === 'should') return 'bg-yellow-400'
  return 'bg-blue-400'
})
</script>
