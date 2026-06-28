// File parsing service
// For PDFs and images: returns base64 + mimeType for LLM vision input
// For text files: returns extracted text

/**
 * Determine if a file type needs to be sent as base64 to the LLM.
 * @param {File} file
 * @returns {boolean}
 */
export function isVisualFile(file) {
  return (
    file.type === 'application/pdf' ||
    file.type.startsWith('image/')
  )
}

/**
 * Read a file as base64-encoded string (without the data URL prefix).
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove "data:<mime>;base64," prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Read a file as plain text.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * Parse a file and return its content in the appropriate format.
 * @param {File} file
 * @returns {Promise<{ text: string|null, base64: string|null, mimeType: string|null }>}
 */
export async function parseFile(file) {
  if (isVisualFile(file)) {
    const base64 = await fileToBase64(file)
    return {
      text: null,
      base64,
      mimeType: file.type,
    }
  }

  // Plain text files (.txt, etc.)
  const text = await fileToText(file)
  return {
    text,
    base64: null,
    mimeType: null,
  }
}

/**
 * Generate a unique ID for a file based on name + size + lastModified.
 * @param {File} file
 * @returns {string}
 */
export function generateFileId(file) {
  return `${file.name}-${file.size}-${file.lastModified}`
}
