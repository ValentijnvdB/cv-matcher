<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Top navigation bar -->
    <header class="bg-gray-900 shadow-sm flex-shrink-0">
      <div class="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <!-- Logo + tabs -->
        <div class="flex items-center gap-1">
          <span class="text-white font-semibold text-sm mr-4 tracking-tight">CV Matcher</span>
          <nav class="flex items-center">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-button"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
              <span
                v-if="tab.id === 'cvs' && cvStore.cvList.length"
                class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs bg-white/20 text-white font-medium"
              >
                {{ cvStore.cvList.length }}
              </span>
              <span
                v-if="tab.id === 'requirements' && vacancyStore.requirements.length"
                class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs bg-white/20 text-white font-medium"
              >
                {{ vacancyStore.requirements.length }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Import / Export -->
        <div class="flex items-center gap-2">
          <button class="btn-ghost text-gray-400 hover:text-white text-xs gap-1.5 py-1.5" title="Import JSON" @click="triggerImport">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Import
          </button>
          <button class="btn-ghost text-gray-400 hover:text-white text-xs gap-1.5 py-1.5" title="Export JSON" @click="handleExport">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Export
          </button>
          <input ref="importInputRef" type="file" accept=".json" class="hidden" @change="handleImport" />
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <main class="flex-1 min-h-0 overflow-auto">
      <div class="max-w-7xl w-full mx-auto px-4 py-5 h-full">
        <VacancyView v-if="activeTab === 'vacancy'" />
        <RequirementsView v-else-if="activeTab === 'requirements'" />
        <CvsView v-else-if="activeTab === 'cvs'" />
        <HowItWorksView v-else-if="activeTab === 'how'" />
        <SettingsView v-else-if="activeTab === 'settings'" />
      </div>
    </main>

    <!-- Import error toast -->
    <Transition name="toast">
      <div
        v-if="importError"
        class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
      >
        <svg class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        {{ importError }}
      </div>
    </Transition>

    <!-- Import success toast -->
    <Transition name="toast">
      <div
        v-if="importSuccess"
        class="fixed bottom-4 right-4 bg-green-600 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
      >
        <svg class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Import successful
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, provide } from 'vue'
import { useVacancyStore } from '@/stores/vacancy'
import { useCvStore } from '@/stores/cvs'
import { exportToJson, importFromJson } from '@/services/exportImport'
import VacancyView from '@/views/VacancyView.vue'
import RequirementsView from '@/views/RequirementsView.vue'
import CvsView from '@/views/CvsView.vue'
import HowItWorksView from '@/views/HowItWorksView.vue'
import SettingsView from '@/views/SettingsView.vue'

const vacancyStore = useVacancyStore()
const cvStore = useCvStore()

const activeTab = ref(localStorage.getItem('activeTab') || 'how')

watch(activeTab, (val) => {
  localStorage.setItem('activeTab', val)
})
const importInputRef = ref(null)
const importError = ref('')
const importSuccess = ref(false)

const tabs = [
  { id: 'vacancy',      label: 'Vacancy' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'cvs',          label: 'CVs' },
  { id: 'how',          label: 'How does it work?' },
  { id: 'settings',     label: 'Settings' },
]

// Allow child components to navigate to a top-level tab
provide('navigateTo', (tabId) => { activeTab.value = tabId })

// Initialize stores from IndexedDB
onMounted(async () => {
  await vacancyStore.initialize()
  await cvStore.initialize()
})

// --- Export ---
async function handleExport() {
  const vacancyRecord = {
    text: vacancyStore.vacancyText,
    base64: vacancyStore.vacancyBase64,
    mimeType: vacancyStore.vacancyMimeType,
    fileName: vacancyStore.vacancyFileName,
    requirements: vacancyStore.requirements,
  }
  const cvRecords = cvStore.cvList
  exportToJson(vacancyRecord, cvRecords)
}

// --- Import ---
function triggerImport() {
  importInputRef.value?.click()
}

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return

  try {
    const { vacancy, cvs } = await importFromJson(file)

    // Load vacancy
    if (vacancy) {
      await vacancyStore.setVacancyContent({
        text: vacancy.text ?? '',
        base64: vacancy.base64 ?? null,
        mimeType: vacancy.mimeType ?? null,
        fileName: vacancy.fileName ?? '',
      })
      if (vacancy.requirements?.length) {
        vacancyStore.requirements = vacancy.requirements
        await vacancyStore.persist?.()
      }
    }

    // Load CVs
    if (cvs?.length) {
      await cvStore.clearAll()
      for (const cv of cvs) {
        await cvStore.addCv(cv)
      }
    }

    importSuccess.value = true
    setTimeout(() => { importSuccess.value = false }, 3000)
  } catch (err) {
    importError.value = err.message
    setTimeout(() => { importError.value = '' }, 4000)
  } finally {
    e.target.value = ''
  }
}
</script>

<style>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
