<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-4 gap-3">
      <div class="flex items-center gap-2">
        <button class="btn-secondary text-xs gap-1.5" @click="addRequirement">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add requirement
        </button>
        <button
          v-if="vacancyStore.hasRequirements"
          class="btn-danger text-xs gap-1.5"
          @click="showClearConfirm = true"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear all
        </button>
      </div>

      <select v-model="sortOrder" class="text-xs border border-gray-200 rounded-md py-1.5 pl-3 pr-7 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer">
        <option value="desc">Priority: high → low</option>
        <option value="asc">Priority: low → high</option>
      </select>
    </div>

    <!-- Confirm clear all dialog -->
    <ConfirmDialog
      v-model="showClearConfirm"
      title="Clear all requirements?"
      message="This will permanently delete all requirements. This cannot be undone."
      confirm-label="Clear all"
      cancel-label="Cancel"
      danger
      @confirm="clearAllRequirements"
      @cancel="showClearConfirm = false"
    />

    <!-- Loading state -->
    <LoadingSpinner v-if="vacancyStore.isLoading" message="Extracting requirements…" />

    <!-- Error state -->
    <ErrorMessage
      v-else-if="vacancyStore.error"
      :message="vacancyStore.error"
      @retry="vacancyStore.extractRequirements()"
    />

    <!-- Empty state -->
    <div
      v-else-if="!vacancyStore.hasRequirements"
      class="flex flex-col items-center justify-center flex-1 text-center py-16"
    >
      <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586" />
        </svg>
      </div>
      <p class="text-sm text-gray-500 font-medium">No requirements yet</p>
      <p class="text-xs text-gray-400 mt-1">Apply a vacancy to extract requirements automatically</p>
    </div>

    <!-- Requirements list -->
    <div v-else class="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1">
      <RequirementRow
        v-for="req in sortedRequirements"
        :key="req.id"
        :requirement="req"
        @update="vacancyStore.updateRequirement"
        @delete="vacancyStore.deleteRequirement"
      />
    </div>

    <!-- Summary footer -->
    <div v-if="vacancyStore.hasRequirements && !vacancyStore.isLoading" class="mt-4 pt-3 border-t border-gray-100 flex gap-4">
      <span class="text-xs text-gray-400">
        <span class="font-semibold text-red-500">{{ counts.must }}</span> must •
        <span class="font-semibold text-yellow-500">{{ counts.should }}</span> should •
        <span class="font-semibold text-blue-500">{{ counts.nice }}</span> nice
      </span>
      <span class="text-xs text-gray-400 ml-auto">{{ vacancyStore.requirements.length }} total</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVacancyStore } from '@/stores/vacancy'
import RequirementRow from './RequirementRow.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const vacancyStore = useVacancyStore()

const sortOrder = ref('desc')
const showClearConfirm = ref(false)

async function clearAllRequirements() {
  vacancyStore.requirements = []
  await vacancyStore.persist()
  showClearConfirm.value = false
}

const PRIORITY_ORDER = { must: 0, should: 1, nice: 2 }

const sortedRequirements = computed(() => {
  const reqs = [...vacancyStore.requirements]
  reqs.sort((a, b) => {
    const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    return sortOrder.value === 'desc' ? diff : -diff
  })
  return reqs
})

const counts = computed(() => ({
  must:   vacancyStore.requirements.filter((r) => r.priority === 'must').length,
  should: vacancyStore.requirements.filter((r) => r.priority === 'should').length,
  nice:   vacancyStore.requirements.filter((r) => r.priority === 'nice').length,
}))

function addRequirement() {
  vacancyStore.addRequirement()
}
</script>
