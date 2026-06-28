<template>
  <div class="space-y-6 max-w-lg">
    <div>
      <h2 class="text-base font-semibold text-gray-900 mb-4">General</h2>

      <!-- Scoring weights -->
      <div class="card p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-800">Priority weights</h3>
          <button class="text-xs text-primary-600 hover:text-primary-700" @click="settings.resetWeights()">
            Reset to defaults
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-4">
          These weights determine how much each priority level contributes to the overall match score.
        </p>
        <div class="space-y-3">
          <div v-for="item in weightItems" :key="item.key" class="flex items-center gap-3">
            <span class="text-xs text-gray-600 w-24 flex-shrink-0">{{ item.label }}</span>
            <input
              v-model.number="settings.weights[item.key]"
              type="number"
              min="0"
              max="10"
              step="1"
              class="input w-20 text-center text-sm"
              @change="onWeightsChanged"
            />
            <span class="text-xs text-gray-400">× score per requirement</span>
          </div>
        </div>
      </div>

      <!-- Category thresholds -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-800">Category thresholds</h3>
          <button class="text-xs text-primary-600 hover:text-primary-700" @click="settings.resetThresholds()">
            Reset to defaults
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-4">
          These percentages define when a candidate falls into each match category, relative to the maximum possible score.
        </p>
        <div class="space-y-3">
          <div v-for="item in thresholdItems" :key="item.key" class="flex items-center gap-3">
            <div :class="item.dot" class="w-2.5 h-2.5 rounded-full flex-shrink-0" />
            <span class="text-xs text-gray-600 w-32 flex-shrink-0">{{ item.label }}</span>
            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-400">≥</span>
              <input
                v-model.number="settings.thresholds[item.key]"
                type="number"
                min="0"
                max="100"
                step="5"
                class="input w-16 text-center text-sm"
                @change="onThresholdsChanged"
              />
              <span class="text-xs text-gray-400">%</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 rounded-full bg-gray-900 flex-shrink-0" />
            <span class="text-xs text-gray-600 w-32 flex-shrink-0">No match</span>
            <span class="text-xs text-gray-400">Below fair threshold</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings'
import { useCvStore } from '@/stores/cvs'

const settings = useSettingsStore()
const cvStore = useCvStore()

const weightItems = [
  { key: 'must',   label: 'Must have' },
  { key: 'should', label: 'Should have' },
  { key: 'nice',   label: 'Nice to have' },
]

const thresholdItems = [
  { key: 'excellent', label: 'Excellent match', dot: 'bg-match-excellent' },
  { key: 'good',      label: 'Good match',      dot: 'bg-match-good' },
  { key: 'fair',      label: 'Fair match',       dot: 'bg-match-fair' },
]

// Re-evaluate all CVs when weights or thresholds change
function onWeightsChanged() {
  cvStore.reEvaluateAll()
}

function onThresholdsChanged() {
  cvStore.reEvaluateAll()
}
</script>
