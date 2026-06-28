<template>
  <div class="flex gap-5 h-full">
    <!-- Left panel: CV list -->
    <div class="w-64 flex-shrink-0 flex flex-col">
      <!-- Toolbar -->
      <div class="flex items-center gap-2 mb-3">
        <select v-model="sortOrder" class="flex-1 text-xs border border-gray-200 rounded-md py-1.5 pl-2 pr-6 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-400">
          <option value="match-desc">Match: high → low</option>
          <option value="match-asc">Match: low → high</option>
          <option value="added-desc">Newest first</option>
          <option value="added-asc">Oldest first</option>
        </select>
        <button
          v-if="cvStore.cvList.length > 0"
          class="btn-danger text-xs gap-1 py-1.5 px-2 flex-shrink-0"
          title="Clear all CVs"
          @click="showClearConfirm = true"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear all
        </button>
      </div>

      <!-- Confirm clear all CVs dialog -->
      <ConfirmDialog
        v-model="showClearConfirm"
        title="Clear all CVs?"
        message="This will permanently remove all uploaded CVs and their analyses. This cannot be undone."
        confirm-label="Clear all"
        cancel-label="Cancel"
        danger
        @confirm="clearAllCvs"
        @cancel="showClearConfirm = false"
      />

      <!-- Upload zone -->
      <FileUploadZone
        label="Add CV(s)"
        hint="PDF, PNG, JPG, TXT"
        accept=".txt,.pdf,.png,.jpg,.jpeg"
        multiple
        class="mb-3"
        @files="onFilesAdded"
      />

      <!-- Analyze all button -->
      <button
        v-if="hasUnanalyzed"
        class="btn-primary text-xs justify-center mb-3"
        :disabled="isAnalyzingAny"
        @click="cvStore.analyzeAll()"
      >
        <svg v-if="isAnalyzingAny" class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ isAnalyzingAny ? 'Analyzing…' : `Analyze all (${unanalyzedCount})` }}
      </button>

      <!-- Outdated banner -->
      <div v-if="outdatedCount > 0" class="mb-3 rounded-lg border border-orange-200 bg-orange-50 p-2.5">
        <div class="flex items-start gap-2">
          <svg class="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-orange-700">
              {{ outdatedCount }} {{ outdatedCount === 1 ? 'analysis is' : 'analyses are' }} outdated
            </p>
            <p class="text-xs text-orange-600 mt-0.5">Requirements have changed since last analysis.</p>
          </div>
        </div>
        <button
          class="mt-2 w-full text-xs font-medium rounded-md px-2.5 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center justify-center gap-1.5"
          :disabled="isAnalyzingAny"
          @click="cvStore.analyzeOutdated()"
        >
          <svg v-if="isAnalyzingAny" class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {{ isAnalyzingAny ? 'Analyzing…' : `Re-analyze outdated (${outdatedCount})` }}
        </button>
      </div>

      <!-- No vacancy warning -->
      <div v-if="!vacancyStore.hasRequirements && cvStore.cvList.length > 0" class="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-2.5 text-xs text-yellow-700">
        Add requirements first under the Vacancy tab.
      </div>

      <!-- CV list -->
      <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <div v-if="sortedCvs.length === 0" class="text-center py-8">
          <p class="text-xs text-gray-400">No CVs uploaded yet.</p>
        </div>
        <div v-for="cv in sortedCvs" :key="cv.id" class="group">
          <CvListItem
            :cv="cv"
            :is-selected="cvStore.selectedCvId === cv.id"
            :is-analyzing="!!cvStore.analyzingIds[cv.id]"
            :is-outdated="isOutdatedCv(cv)"
            @select="cvStore.selectCv"
            @remove="removeCv"
          />
        </div>
      </div>
    </div>

    <!-- Right panel: detail -->
    <div class="flex-1 min-w-0 card p-5 overflow-y-auto">
      <CvDetail
        :cv="cvStore.selectedCv"
        :is-analyzing="cvStore.selectedCv ? !!cvStore.analyzingIds[cvStore.selectedCv.id] : false"
        @analyze="cvStore.analyzeCv"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVacancyStore } from '@/stores/vacancy'
import { useCvStore } from '@/stores/cvs'
import { parseFile, generateFileId } from '@/services/fileParser'
import { CATEGORY_ORDER } from '@/services/scoring'
import CvListItem from '@/components/cvs/CvListItem.vue'
import CvDetail from '@/components/cvs/CvDetail.vue'
import FileUploadZone from '@/components/shared/FileUploadZone.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const vacancyStore = useVacancyStore()
const cvStore = useCvStore()

const sortOrder = ref('match-desc')
const showClearConfirm = ref(false)

async function clearAllCvs() {
  await cvStore.clearAll()
  showClearConfirm.value = false
}

const isAnalyzingAny = computed(() =>
  Object.values(cvStore.analyzingIds).some(Boolean),
)

const hasUnanalyzed = computed(() =>
  cvStore.cvList.some((cv) => !cv.scores && !cvStore.analyzingIds[cv.id]),
)

const unanalyzedCount = computed(() =>
  cvStore.cvList.filter((cv) => !cv.scores && !cvStore.analyzingIds[cv.id]).length,
)

function isOutdatedCv(cv) {
  return !!(cv.scores && cv.requirementsHash !== vacancyStore.requirementsHash)
}

const outdatedCount = computed(() =>
  cvStore.cvList.filter((cv) => isOutdatedCv(cv) && !cvStore.analyzingIds[cv.id]).length,
)

const sortedCvs = computed(() => {
  const list = [...cvStore.cvList]

  if (sortOrder.value === 'match-desc') {
    list.sort((a, b) => {
      const ao = a.evaluation ? CATEGORY_ORDER[a.evaluation.category] : 4
      const bo = b.evaluation ? CATEGORY_ORDER[b.evaluation.category] : 4
      return ao - bo
    })
  } else if (sortOrder.value === 'match-asc') {
    list.sort((a, b) => {
      const ao = a.evaluation ? CATEGORY_ORDER[a.evaluation.category] : -1
      const bo = b.evaluation ? CATEGORY_ORDER[b.evaluation.category] : -1
      return bo - ao
    })
  } else if (sortOrder.value === 'added-desc') {
    list.sort((a, b) => b.addedAt - a.addedAt)
  } else {
    list.sort((a, b) => a.addedAt - b.addedAt)
  }

  return list
})

async function onFilesAdded(files) {
  for (const file of files) {
    const id = generateFileId(file)
    if (cvStore.cvs[id]) continue // skip duplicates

    const parsed = await parseFile(file)
    await cvStore.addCv({
      id,
      fileName: file.name,
      text: parsed.text,
      base64: parsed.base64,
      mimeType: parsed.mimeType,
    })
  }
}

function removeCv(id) {
  cvStore.removeCv(id)
}
</script>
