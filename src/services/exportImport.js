// Import/export service for JSON data exchange between recruiters

/**
 * Export current vacancy and CV data as a JSON file download.
 *
 * @param {object} vacancyData - full vacancy record from IndexedDB
 * @param {Array} cvData - array of CV records from IndexedDB
 */
export function exportToJson(vacancyData, cvData) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    vacancy: vacancyData,
    cvs: cvData,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cv-matcher-export-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import data from a JSON file.
 * Validates structure and returns parsed payload.
 *
 * @param {File} file
 * @returns {Promise<{ vacancy: object, cvs: Array }>}
 */
export async function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)

        if (!parsed.vacancy && !parsed.cvs) {
          reject(new Error('Invalid export file: missing vacancy and cvs fields.'))
          return
        }

        resolve({
          vacancy: parsed.vacancy ?? null,
          cvs: parsed.cvs ?? [],
        })
      } catch (err) {
        reject(new Error(`Failed to parse JSON: ${err.message}`))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}
