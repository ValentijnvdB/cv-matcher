<template>
  <div class="flex gap-4 h-full">
    <!-- Main content area -->
    <div class="flex-1 min-w-0 flex flex-col min-h-0">
      <!-- File label + remove (shown for any loaded file) -->
      <div v-if="displayFileName" class="mb-3 flex items-center gap-2 flex-shrink-0">
        <span class="text-xs text-gray-500">Loaded file:</span>
        <span class="text-xs font-medium text-gray-700 truncate">{{ displayFileName }}</span>
        <button class="btn-ghost text-xs py-0.5 px-1.5" @click="clearContent">
          Remove
        </button>
      </div>

      <!-- Image preview -->
      <div
        v-if="previewType === 'image'"
        class="flex-1 rounded-lg border border-gray-200 bg-gray-50 overflow-auto flex items-start justify-center p-4"
        style="height: calc(100vh - 230px)"
      >
        <img
          :src="previewSrc"
          alt="Uploaded vacancy"
          class="max-w-full object-contain rounded"
        />
      </div>

      <!-- PDF preview -->
      <iframe
        v-else-if="previewType === 'pdf'"
        :src="previewSrc"
        class="flex-1 w-full rounded-lg border border-gray-200 min-h-0"
      />

      <!-- Text textarea (default) -->
      <textarea
        v-else
        v-model="localText"
        class="input resize-none font-mono text-xs leading-relaxed"
        style="height: calc(100vh - 230px)"
        placeholder="Paste vacancy text here, or upload a file (PDF, image, or text) →"
        @input="onTextInput"
      />
    </div>

    <!-- Right sidebar: actions -->
    <div class="flex flex-col gap-3 w-44 flex-shrink-0 pt-0.5">
      <FileUploadZone
        label="Upload file"
        hint="PDF, PNG, JPG, TXT"
        accept=".txt,.pdf,.png,.jpg,.jpeg"
        @files="onFileUpload"
      />

      <button
        class="btn-primary w-full justify-center"
        :disabled="!canApply || vacancyStore.isLoading"
        @click="applyVacancy"
      >
        <svg v-if="!vacancyStore.isLoading" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ vacancyStore.isLoading ? 'Processing…' : 'Apply' }}
      </button>
    </div>
  </div>

  <!-- Confirm overwrite dialog -->
  <ConfirmDialog
    v-model="showConfirm"
    title="Overwrite existing requirements?"
    message="There are already requirements saved. Applying a new vacancy will replace them. This cannot be undone."
    confirm-label="Continue"
    cancel-label="Cancel"
    danger
    @confirm="confirmApply"
    @cancel="showConfirm = false"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVacancyStore } from '@/stores/vacancy'
import { parseFile } from '@/services/fileParser'
import FileUploadZone from '@/components/shared/FileUploadZone.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const emit = defineEmits(['applied'])

const vacancyStore = useVacancyStore()

const localText = ref(vacancyStore.vacancyText)
const editingText = ref(false)
const showConfirm = ref(false)
const pendingFile = ref(null)

// Sync localText when the store finishes initializing from IndexedDB (fixes blank
// textarea on page reload when the store loads asynchronously after component mount).
watch(
  () => vacancyStore.isInitialized,
  (initialized) => {
    if (initialized && !editingText.value) {
      localText.value = vacancyStore.vacancyText
    }
  },
  { immediate: true },
)

// --- Preview helpers ---

// Active base64 data: prefer pendingFile (not yet applied), fall back to stored
const activeBase64 = computed(() =>
  pendingFile.value?.base64 ?? vacancyStore.vacancyBase64 ?? null,
)
const activeMimeType = computed(() =>
  pendingFile.value?.mimeType ?? vacancyStore.vacancyMimeType ?? null,
)

// 'image' | 'pdf' | null
const previewType = computed(() => {
  if (!activeBase64.value || !activeMimeType.value) return null
  if (activeMimeType.value.startsWith('image/')) return 'image'
  if (activeMimeType.value === 'application/pdf') return 'pdf'
  return null
})

// Data-URL for <img> or <iframe>
const previewSrc = computed(() => {
  if (!previewType.value) return null
  return `data:${activeMimeType.value};base64,${activeBase64.value}`
})

// File label: show when a non-text file is loaded (pending or stored)
const displayFileName = computed(() => {
  if (previewType.value) {
    return pendingFile.value?.fileName ?? vacancyStore.vacancyFileName ?? null
  }
  // Also show for text files loaded from disk (not manual typing)
  if (!editingText.value && vacancyStore.vacancyFileName) {
    return vacancyStore.vacancyFileName
  }
  return null
})

const canApply = computed(() =>
  localText.value.trim() || vacancyStore.vacancyBase64 || pendingFile.value?.base64,
)

function onTextInput() {
  editingText.value = true
  // Clear any loaded file when user types
  if (vacancyStore.vacancyBase64) {
    vacancyStore.setVacancyContent({ text: localText.value, base64: null, mimeType: null, fileName: '' })
  }
}

async function onFileUpload(files) {
  const file = files[0]
  if (!file) return

  const parsed = await parseFile(file)
  pendingFile.value = { ...parsed, fileName: file.name }

  if (parsed.text) localText.value = parsed.text
  else localText.value = ''
  editingText.value = false
}

function applyVacancy() {
  if (vacancyStore.hasRequirements) {
    showConfirm.value = true
  } else {
    confirmApply()
  }
}

async function confirmApply() {
  showConfirm.value = false

  // Save content first
  if (pendingFile.value) {
    await vacancyStore.setVacancyContent(pendingFile.value)
    pendingFile.value = null
  } else {
    await vacancyStore.setVacancyContent({
      text: localText.value,
      base64: null,
      mimeType: null,
      fileName: '',
    })
  }

  // Navigation to requirements tab is handled via the 'applied' emit below
  const success = await vacancyStore.extractRequirements()
  if (success) {
    emit('applied')
  }
}

function clearContent() {
  localText.value = ''
  editingText.value = false
  pendingFile.value = null
  vacancyStore.setVacancyContent({ text: '', base64: null, mimeType: null, fileName: '' })
}
</script>
