import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbPut, dbGet, dbClear, STORES } from '@/services/db'
import { llmChat, buildVacancyMessages } from '@/services/llm'
import { useSettingsStore } from './settings'
import { hashRequirements } from '@/services/scoring'

const VACANCY_ID = 'current'

export const useVacancyStore = defineStore('vacancy', () => {
  const settings = useSettingsStore()

  // Raw content
  const vacancyText = ref('')
  const vacancyBase64 = ref(null)
  const vacancyMimeType = ref(null)
  const vacancyFileName = ref('')

  // Extracted requirements
  const requirements = ref([]) // [{ id, text, priority }]

  // UI state
  const isLoading = ref(false)
  const error = ref(null)
  const isInitialized = ref(false)

  const hasRequirements = computed(() => requirements.value.length > 0)
  const hasContent = computed(() => vacancyText.value.trim() || vacancyBase64.value)
  const requirementsHash = computed(() => hashRequirements(requirements.value))

  /** Load from IndexedDB on app start */
  async function initialize() {
    try {
      const record = await dbGet(STORES.VACANCY, VACANCY_ID)
      if (record) {
        vacancyText.value = record.text ?? ''
        vacancyBase64.value = record.base64 ?? null
        vacancyMimeType.value = record.mimeType ?? null
        vacancyFileName.value = record.fileName ?? ''
        requirements.value = record.requirements ?? []
      }
    } catch (err) {
      console.error('Failed to load vacancy from DB:', err)
    } finally {
      isInitialized.value = true
    }
  }

  /** Persist current state to IndexedDB */
  async function persist() {
    await dbPut(STORES.VACANCY, {
      id: VACANCY_ID,
      text: vacancyText.value,
      base64: vacancyBase64.value,
      mimeType: vacancyMimeType.value,
      fileName: vacancyFileName.value,
      requirements: requirements.value,
    })
  }

  /** Set the vacancy content from a file or text input */
  async function setVacancyContent({ text, base64, mimeType, fileName }) {
    vacancyText.value = text ?? ''
    vacancyBase64.value = base64 ?? null
    vacancyMimeType.value = mimeType ?? null
    vacancyFileName.value = fileName ?? ''
    await persist()
  }

  /** Extract requirements from current vacancy content via LLM */
  async function extractRequirements() {
    if (!hasContent.value) {
      error.value = 'No vacancy content to analyze.'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const messages = buildVacancyMessages(
        settings.vacancyPrompt,
        vacancyText.value || null,
        vacancyBase64.value,
        vacancyMimeType.value,
      )

      const responseText = await llmChat({
        provider: settings.provider,
        settings: settings.getProviderSettings(),
        messages,
      })

      // Strip markdown code fences if present
      const cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array')
      }

      // Validate and normalize each requirement
      requirements.value = parsed.map((item, index) => ({
        id: item.id ?? `req_${Date.now()}_${index}`,
        text: String(item.text ?? ''),
        priority: ['must', 'should', 'nice'].includes(item.priority) ? item.priority : 'should',
      }))

      await persist()
      return true
    } catch (err) {
      if (err instanceof SyntaxError) {
        error.value = 'Invalid format received from LLM (expected JSON array).'
      } else if (err.message.includes('API error')) {
        error.value = `Provider error: ${err.message}`
      } else {
        error.value = `Error: ${err.message}`
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Update a single requirement field */
  async function updateRequirement(id, field, value) {
    const req = requirements.value.find((r) => r.id === id)
    if (req) {
      req[field] = value
      await persist()
    }
  }

  /** Add a new empty requirement */
  async function addRequirement() {
    requirements.value.push({
      id: `req_manual_${Date.now()}`,
      text: '',
      priority: 'should',
    })
    await persist()
  }

  /** Delete a requirement by ID */
  async function deleteRequirement(id) {
    requirements.value = requirements.value.filter((r) => r.id !== id)
    await persist()
  }

  /** Clear all vacancy data */
  async function clearAll() {
    vacancyText.value = ''
    vacancyBase64.value = null
    vacancyMimeType.value = null
    vacancyFileName.value = ''
    requirements.value = []
    error.value = null
    await dbClear(STORES.VACANCY)
  }

  return {
    vacancyText,
    vacancyBase64,
    vacancyMimeType,
    vacancyFileName,
    requirements,
    isLoading,
    error,
    isInitialized,
    hasRequirements,
    hasContent,
    requirementsHash,
    initialize,
    persist,
    setVacancyContent,
    extractRequirements,
    updateRequirement,
    addRequirement,
    deleteRequirement,
    clearAll,
  }
})
