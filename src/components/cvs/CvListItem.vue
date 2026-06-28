<template>
  <div
    class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 border"
    :class="isSelected
      ? 'bg-primary-50 border-primary-200 shadow-sm'
      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'"
    @click="$emit('select', cv.id)"
  >
    <!-- Category badge -->
    <div :class="badgeClass">
      {{ badgeText }}
    </div>

    <!-- Name & status -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-800 truncate">{{ cv.fileName }}</p>
      <p v-if="isAnalyzing" class="text-xs text-primary-500 flex items-center gap-1 mt-0.5">
        <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Analyzing…
      </p>
      <p v-else-if="cv.analyzeError" class="text-xs text-red-500 mt-0.5 truncate">Error</p>
      <p v-else-if="isOutdated" class="text-xs text-orange-500 mt-0.5">Analysis outdated</p>
      <p v-else-if="cv.evaluation" class="text-xs text-gray-400 mt-0.5">
        {{ categoryLabel }}
      </p>
      <p v-else class="text-xs text-gray-400 mt-0.5">Not analyzed</p>
    </div>

    <!-- Outdated warning icon -->
    <svg
      v-if="isOutdated && !isAnalyzing"
      class="h-4 w-4 text-orange-400 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      title="Analysis is outdated — requirements have changed"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>

    <!-- Remove button -->
    <button
      class="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-gray-400 hover:text-red-500"
      title="Remove CV"
      @click.stop="$emit('remove', cv.id)"
    >
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CATEGORY_LABELS, CATEGORY_LETTERS } from '@/services/scoring'

const props = defineProps({
  cv: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isAnalyzing: { type: Boolean, default: false },
  isOutdated: { type: Boolean, default: false },
})

defineEmits(['select', 'remove'])

const badgeClass = computed(() => {
  if (props.isAnalyzing || !props.cv.evaluation) return 'category-badge category-pending'
  if (props.isOutdated) return 'category-badge category-outdated'
  return `category-badge category-${props.cv.evaluation.category}`
})

const badgeText = computed(() => {
  if (props.isAnalyzing || !props.cv.evaluation) return '?'
  if (props.isOutdated) return '!'
  return CATEGORY_LETTERS[props.cv.evaluation.category] ?? '?'
})

const categoryLabel = computed(() => {
  if (!props.cv.evaluation) return ''
  return CATEGORY_LABELS[props.cv.evaluation.category] ?? ''
})
</script>
