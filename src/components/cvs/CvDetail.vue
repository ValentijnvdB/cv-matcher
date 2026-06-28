<template>
  <div v-if="cv" class="flex flex-col h-full">
    <!-- Header -->
    <div class="mb-4">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h2 class="text-base font-semibold text-gray-900 truncate">{{ cv.fileName }}</h2>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button v-if="cv.base64 || cv.text" class="btn-secondary text-xs" @click="showOriginal = true">
            View original
          </button>
          <button
            class="btn-primary text-xs"
            :disabled="isAnalyzing || !hasRequirements"
            @click="$emit('analyze', cv.id)"
          >
            <svg v-if="isAnalyzing" class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ isAnalyzing ? 'Analyzing…' : cv.evaluation ? 'Re-analyze' : 'Analyze' }}
          </button>
        </div>
      </div>

      <!-- Summary counts -->
      <div v-if="cv.evaluation" class="grid grid-cols-3 gap-2">
        <div
          v-for="(item, key) in summaryItems"
          :key="key"
          class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center"
        >
          <p class="text-lg font-bold text-gray-900">
            {{ item.found }}<span class="text-sm font-normal text-gray-400">/{{ item.total }}</span>
          </p>
          <p class="text-xs text-gray-500 mt-0.5">{{ item.label }}</p>
        </div>
      </div>

      <!-- Error -->
      <ErrorMessage
        v-if="cv.analyzeError"
        :message="cv.analyzeError"
        @retry="$emit('analyze', cv.id)"
      />

      <!-- Not analyzed yet -->
      <div v-if="!cv.evaluation && !cv.analyzeError && !isAnalyzing" class="rounded-lg border border-dashed border-gray-200 p-4 text-center">
        <p class="text-xs text-gray-400">Click "Analyze" to match this CV against the vacancy requirements.</p>
      </div>
    </div>

    <!-- Scores per requirement -->
    <div v-if="cv.scores" class="flex-1 overflow-y-auto space-y-4 pr-1">
      <div v-for="group in requirementGroups" :key="group.priority">
        <p class="section-label mb-2">{{ group.label }}</p>
        <div class="space-y-1">
          <div
            v-for="req in group.items"
            :key="req.id"
            class="rounded-md bg-white border border-gray-100 overflow-hidden"
          >
            <!-- Row: always visible -->
            <div
              class="flex items-center gap-2.5 px-3 py-2"
              :class="hasReason(req.id) ? 'cursor-pointer select-none' : ''"
              @click="hasReason(req.id) ? toggleExpanded(req.id) : null"
            >
              <!-- Score indicator -->
              <div :class="scoreClass(cv.scores[req.id])" class="w-3.5 h-3.5 rounded-sm flex-shrink-0" />
              <span class="text-sm text-gray-700 leading-snug flex-1">{{ req.text }}</span>
              <!-- Expand chevron — only when a reason exists -->
              <svg
                v-if="hasReason(req.id)"
                class="h-3.5 w-3.5 text-gray-400 flex-shrink-0 transition-transform duration-150"
                :class="expandedIds.has(req.id) ? 'rotate-180' : ''"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <!-- Expandable reason -->
            <Transition name="expand">
              <div
                v-if="hasReason(req.id) && expandedIds.has(req.id)"
                class="px-3 pb-2.5 pt-0"
              >
                <p class="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
                  {{ cv.reasons[req.id] }}
                </p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state when no CV selected -->
  <div v-else class="flex flex-col items-center justify-center h-full text-center py-16">
    <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
      <svg class="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    </div>
    <p class="text-sm text-gray-500 font-medium">Select a CV</p>
    <p class="text-xs text-gray-400 mt-1">Choose a CV from the list to view the analysis</p>
  </div>

  <!-- Original file overlay -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showOriginal" class="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showOriginal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900">{{ cv?.fileName }}</h3>
            <button class="btn-ghost" @click="showOriginal = false">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="overflow-auto flex-1 p-5">
            <!-- Image -->
            <img
              v-if="isImage"
              :src="`data:${cv.mimeType};base64,${cv.base64}`"
              class="max-w-full mx-auto"
              alt="CV"
            />
            <!-- PDF embed -->
            <iframe
              v-else-if="isPdf"
              :src="`data:application/pdf;base64,${cv.base64}`"
              class="w-full h-full min-h-[70vh]"
              title="CV PDF"
            />
            <!-- Text -->
            <pre v-else class="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{{ cv?.text }}</pre>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVacancyStore } from '@/stores/vacancy'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'

const props = defineProps({
  cv: { type: Object, default: null },
  isAnalyzing: { type: Boolean, default: false },
})

defineEmits(['analyze'])

const vacancyStore = useVacancyStore()
const showOriginal = ref(false)

// Track which requirement rows are expanded
const expandedIds = ref(new Set())

function hasReason(reqId) {
  return !!(props.cv?.reasons?.[reqId])
}

function toggleExpanded(reqId) {
  const next = new Set(expandedIds.value)
  if (next.has(reqId)) {
    next.delete(reqId)
  } else {
    next.add(reqId)
  }
  expandedIds.value = next
}

const hasRequirements = computed(() => vacancyStore.hasRequirements)

const isImage = computed(() => props.cv?.mimeType?.startsWith('image/'))
const isPdf = computed(() => props.cv?.mimeType === 'application/pdf')

const summaryItems = computed(() => {
  if (!props.cv?.evaluation) return {}
  const s = props.cv.evaluation.summary

  // Format a found count: show decimals only when needed (e.g. 3.5, not 3.0)
  const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1)

  return {
    must:   { found: fmt(s.must?.found ?? 0),   total: s.must?.total ?? 0,   label: 'Must have' },
    should: { found: fmt(s.should?.found ?? 0), total: s.should?.total ?? 0, label: 'Should have' },
    nice:   { found: fmt(s.nice?.found ?? 0),   total: s.nice?.total ?? 0,   label: 'Nice to have' },
  }
})

const requirementGroups = computed(() => {
  const reqs = vacancyStore.requirements
  return [
    { priority: 'must',   label: 'Must have',    items: reqs.filter((r) => r.priority === 'must') },
    { priority: 'should', label: 'Should have',  items: reqs.filter((r) => r.priority === 'should') },
    { priority: 'nice',   label: 'Nice to have', items: reqs.filter((r) => r.priority === 'nice') },
  ].filter((g) => g.items.length > 0)
})

function scoreClass(score) {
  if (score === 1)  return 'bg-match-excellent'
  if (score === 0)  return 'bg-match-fair'
  return 'bg-score-low'
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.expand-enter-active, .expand-leave-active {
  transition: opacity 0.15s ease, max-height 0.15s ease;
  max-height: 200px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
