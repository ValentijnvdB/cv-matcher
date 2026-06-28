import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbPut, dbGet, dbGetAll, dbDelete, STORES } from '@/services/db'
import { llmChat, buildCvMessages } from '@/services/llm'
import { evaluateCv, hashRequirements } from '@/services/scoring'
import { useSettingsStore } from './settings'
import { useVacancyStore } from './vacancy'

export const useCvStore = defineStore('cvs', () => {
  const settings = useSettingsStore()
  const vacancyStore = useVacancyStore()

  // Map of cv.id -> cv record
  const cvs = ref({})

  // Currently selected CV id
  const selectedCvId = ref(null)

  // Per-CV analysis loading state: { [cvId]: boolean }
  const analyzingIds = ref({})

  const cvList = computed(() => Object.values(cvs.value))

  const selectedCv = computed(() =>
    selectedCvId.value ? cvs.value[selectedCvId.value] ?? null : null,
  )

  /** Load all CVs from IndexedDB */
  async function initialize() {
    try {
      const records = await dbGetAll(STORES.CVS)
      const map = {}
      for (const record of records) {
        map[record.id] = record
      }
      cvs.value = map
    } catch (err) {
      console.error('Failed to load CVs from DB:', err)
    }
  }

  /** Persist a single CV to IndexedDB */
  async function persistCv(cv) {
    await dbPut(STORES.CVS, cv)
  }

  /**
   * Add a new CV to the store.
   * @param {{ id: string, fileName: string, text: string|null, base64: string|null, mimeType: string|null, scores?: object, reasons?: object, requirementsHash?: string, evaluation?: object, analyzeError?: string }} fileData
   */
  async function addCv(fileData) {
    const cv = {
      id: fileData.id,
      fileName: fileData.fileName,
      text: fileData.text,
      base64: fileData.base64,
      mimeType: fileData.mimeType,
      addedAt: fileData.addedAt ?? Date.now(),
      // Analysis results — preserved when importing an existing export
      scores: fileData.scores ?? null,
      reasons: fileData.reasons ?? null,
      requirementsHash: fileData.requirementsHash ?? null,
      evaluation: fileData.evaluation ?? null,
      analyzeError: fileData.analyzeError ?? null,
    }

    cvs.value[cv.id] = cv
    await persistCv(cv)
    return cv
  }

  /** Remove a CV from store and IndexedDB */
  async function removeCv(id) {
    delete cvs.value[id]
    if (selectedCvId.value === id) selectedCvId.value = null
    await dbDelete(STORES.CVS, id)
  }

  /** Select a CV to show in the detail panel */
  function selectCv(id) {
    selectedCvId.value = id === selectedCvId.value ? null : id
  }

  /**
   * Analyze a single CV against the current vacancy requirements.
   * @param {string} cvId
   */
  async function analyzeCv(cvId) {
    const cv = cvs.value[cvId]
    if (!cv) return

    const requirements = vacancyStore.requirements
    if (requirements.length === 0) {
      cv.analyzeError = 'No requirements found. Please process the vacancy first.'
      await persistCv(cv)
      return
    }

    analyzingIds.value[cvId] = true
    cv.analyzeError = null

    try {
      const messages = buildCvMessages(
        settings.cvPrompt,
        requirements,
        cv.text,
        cv.base64,
        cv.mimeType,
      )

      const responseText = await llmChat({
        provider: settings.provider,
        settings: settings.getProviderSettings(),
        messages,
      })

    const cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Response is not an object')
      }

      // Normalize scores to -1, 0, or 1 and extract reasons
      const normalizedScores = {}
      const reasons = {}
      for (const req of requirements) {
        const entry = parsed[req.id]

        // Support both new format { score, reason } and legacy plain number
        let raw, reason
        if (entry !== null && typeof entry === 'object' && 'score' in entry) {
          raw = entry.score
          reason = entry.reason ?? null
        } else {
          raw = entry
          reason = null
        }

        if (raw === 1 || raw === '1') {
          normalizedScores[req.id] = 1
        } else if (raw === 0 || raw === '0') {
          normalizedScores[req.id] = 0
        } else {
          normalizedScores[req.id] = -1
        }

        // Store reason for all scores (including -1)
        if (reason) {
          reasons[req.id] = reason
        }
      }

      cv.scores = normalizedScores
      cv.reasons = reasons
      cv.requirementsHash = hashRequirements(requirements)
      cv.evaluation = evaluateCv(
        requirements,
        normalizedScores,
        settings.weights,
        settings.thresholds,
      )
      cv.analyzeError = null
    } catch (err) {
      if (err instanceof SyntaxError) {
        cv.analyzeError = 'Invalid format received from LLM (expected JSON object).'
      } else if (err.message.includes('API error')) {
        cv.analyzeError = `Provider error: ${err.message}`
      } else {
        cv.analyzeError = `Error: ${err.message}`
      }
      cv.scores = null
      cv.reasons = null
      cv.evaluation = null
    } finally {
      analyzingIds.value[cvId] = false
      await persistCv(cv)
    }
  }

  /**
   * Analyze all CVs that haven't been analyzed yet, sequentially.
   */
  async function analyzeAll() {
    const pending = cvList.value.filter((cv) => !cv.scores)
    for (const cv of pending) {
      await analyzeCv(cv.id)
    }
  }

  /**
   * Re-evaluate all already-analyzed CVs with current weights/thresholds
   * (no LLM call needed, just recalculate from existing scores).
   */
  async function reEvaluateAll() {
    const requirements = vacancyStore.requirements
    for (const cv of cvList.value) {
      if (cv.scores) {
        cv.evaluation = evaluateCv(
          requirements,
          cv.scores,
          settings.weights,
          settings.thresholds,
        )
        await persistCv(cv)
      }
    }
  }

  /**
   * Analyze all CVs whose stored requirementsHash differs from the current one.
   */
  async function analyzeOutdated() {
    const currentHash = hashRequirements(vacancyStore.requirements)
    const outdated = cvList.value.filter(
      (cv) => cv.scores && cv.requirementsHash !== currentHash,
    )
    for (const cv of outdated) {
      await analyzeCv(cv.id)
    }
  }

  /** Clear all CVs */
  async function clearAll() {
    const ids = Object.keys(cvs.value)
    cvs.value = {}
    selectedCvId.value = null
    for (const id of ids) {
      await dbDelete(STORES.CVS, id)
    }
  }

  return {
    cvs,
    cvList,
    selectedCvId,
    selectedCv,
    analyzingIds,
    initialize,
    addCv,
    removeCv,
    selectCv,
    analyzeCv,
    analyzeAll,
    analyzeOutdated,
    reEvaluateAll,
    clearAll,
  }
})
