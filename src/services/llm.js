// LLM provider service — supports OpenAI, Ollama, and Anthropic Claude
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export const PROVIDERS = {
  OPENAI:    'openai',
  OLLAMA:    'ollama',
  ANTHROPIC: 'anthropic',
}

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

function isPdfDataUri(url) {
  return url.startsWith('data:application/pdf;base64,')
}

function extractBase64FromDataUri(url) {
  return url.slice(url.indexOf(',') + 1)
}

/**
 * Extract plain text from a base64-encoded PDF using pdf.js.
 * Used as a fallback for providers without native PDF support (Ollama).
 * @param {string} base64Data
 * @returns {Promise<string>}
 */
async function extractPdfText(base64Data) {
  const binary = atob(base64Data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
  const pageTexts = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_, i) => {
      const page = await pdf.getPage(i + 1)
      const content = await page.getTextContent()
      return content.items.map((item) => item.str).join(' ')
    }),
  )
  return pageTexts.join('\n\n')
}

// ---------------------------------------------------------------------------
// Provider registry
//
// Each entry defines four functions:
//   transform(messages)           → Promise<providerMessages>
//   buildRequest(settings, msgs)  → { url, headers, body }
//   extractText(data)             → string
//   capabilities                  → { supportsPdf: boolean }
//
// To add a new provider: add one entry here and a matching PROVIDERS constant.
// Nothing else needs to change.
// ---------------------------------------------------------------------------

const PROVIDER_REGISTRY = {

  // ── OpenAI ────────────────────────────────────────────────────────────────
  [PROVIDERS.OPENAI]: {
    capabilities: { supportsPdf: true },

    // OpenAI is the canonical internal format — no transformation needed.
    async transform(messages) {
      return messages
    },

    buildRequest(settings, messages) {
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: {
          model: settings.model || 'gpt-4o-mini',
          messages,
          temperature: 0.2,
        },
      }
    },

    extractText(data) {
      return data.choices?.[0]?.message?.content ?? ''
    },
  },

  // ── Ollama ────────────────────────────────────────────────────────────────
  [PROVIDERS.OLLAMA]: {
    capabilities: { supportsPdf: false },

    // Transforms OpenAI-style messages to Ollama's flat format.
    // PDFs are extracted to text via pdf.js; images become a flat base64 array.
    async transform(messages) {
      return Promise.all(
        messages.map(async (msg) => {
          if (typeof msg.content === 'string') return msg

          if (Array.isArray(msg.content)) {
            let textContent = ''
            const imagesArray = []

            for (const part of msg.content) {
              if (part.type === 'text') {
                textContent += part.text
              } else if (part.type === 'image_url' && part.image_url?.url) {
                const url = part.image_url.url

                if (isPdfDataUri(url)) {
                  const pdfText = await extractPdfText(extractBase64FromDataUri(url))
                  textContent += (textContent ? '\n\n' : '') + pdfText
                } else {
                  const base64Match = url.match(/^data:[^;]+;base64,(.+)$/)
                  imagesArray.push(base64Match?.[1] ?? url)
                }
              }
            }

            const transformed = { role: msg.role, content: textContent }
            if (imagesArray.length > 0) transformed.images = imagesArray
            return transformed
          }

          return msg
        }),
      )
    },

    buildRequest(settings, messages) {
      const baseUrl = (settings.ollamaBaseUrl || 'http://localhost:11434').replace(/\/$/, '')
      return {
        url: `${baseUrl}/api/chat`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          model: settings.model || 'llama3.2',
          messages,
          stream: false,
          options: { temperature: 0.2 },
        },
      }
    },

    extractText(data) {
      return data.message?.content ?? ''
    },
  },

  // ── Anthropic Claude ──────────────────────────────────────────────────────
  [PROVIDERS.ANTHROPIC]: {
    capabilities: { supportsPdf: true },

    // Transforms OpenAI-style messages to the Anthropic Messages API format.
    //
    // Key differences from OpenAI:
    //   - System messages are extracted into a top-level `system` string
    //     (the Anthropic API does not accept a system role inside `messages`)
    //   - image_url  → { type: "image", source: { type: "base64", ... } }
    //   - PDFs       → { type: "document", source: { type: "base64", ... } }
    //     Claude supports PDFs natively — no pdf.js extraction needed.
    //
    // The return value is { system, messages } so buildRequest can spread them.
    async transform(messages) {
      let system = ''
      const transformed = []

      for (const msg of messages) {
        // Pull system messages out into the top-level system field
        if (msg.role === 'system') {
          system += (system ? '\n\n' : '') + (typeof msg.content === 'string' ? msg.content : '')
          continue
        }

        if (typeof msg.content === 'string') {
          transformed.push({ role: msg.role, content: msg.content })
          continue
        }

        if (Array.isArray(msg.content)) {
          const contentBlocks = []

          for (const part of msg.content) {
            if (part.type === 'text') {
              contentBlocks.push({ type: 'text', text: part.text })

            } else if (part.type === 'image_url' && part.image_url?.url) {
              const url = part.image_url.url
              const base64 = extractBase64FromDataUri(url)

              if (isPdfDataUri(url)) {
                // Native PDF support — send directly as a document block
                contentBlocks.push({
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64,
                  },
                })
              } else {
                // Image — extract MIME type from data URI
                const mimeMatch = url.match(/^data:([^;]+);base64,/)
                const mediaType = mimeMatch?.[1] ?? 'image/jpeg'
                contentBlocks.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64,
                  },
                })
              }
            }
          }

          transformed.push({ role: msg.role, content: contentBlocks })
        }
      }

      return { system, messages: transformed }
    },

    buildRequest(settings, transformed) {
      // transformed is { system, messages } from the Anthropic transform above
      const { system, messages } = transformed
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: {
          model: settings.model || 'claude-sonnet-4-6',
          max_tokens: 4096,
          ...(system ? { system } : {}),
          messages,
          temperature: 0.2,
        },
      }
    },

    extractText(data) {
      // Anthropic returns content as an array of blocks; find the first text block
      return data.content?.find((b) => b.type === 'text')?.text ?? ''
    },
  },
}

// ---------------------------------------------------------------------------
// Core chat function
// ---------------------------------------------------------------------------

/**
 * Send a chat completion request to the configured LLM provider.
 * @param {object} params
 * @param {string} params.provider
 * @param {object} params.settings
 * @param {Array}  params.messages  - OpenAI-style messages (canonical format)
 * @returns {Promise<string>}
 */
export async function llmChat({ provider, settings, messages }) {
  const entry = PROVIDER_REGISTRY[provider]
  if (!entry) throw new Error(`Unknown provider: ${provider}`)

  const transformed = await entry.transform(messages)
  const { url, headers, body } = entry.buildRequest(settings, transformed)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new Error(`Network error connecting to ${provider}: ${err.message}`)
  }

  if (!response.ok) {
    let detail = ''
    try {
      const errBody = await response.json()
      detail = errBody.error?.message || JSON.stringify(errBody)
    } catch {
      detail = await response.text()
    }
    throw new Error(`${provider} API error (${response.status}): ${detail}`)
  }

  const data = await response.json()
  return entry.extractText(data)
}

// ---------------------------------------------------------------------------
// Message builders (canonical OpenAI format — provider-agnostic)
// ---------------------------------------------------------------------------

/**
 * Build messages for vacancy requirements extraction.
 * @param {string}      vacancyPrompt
 * @param {string|null} vacancyText
 * @param {string|null} base64Data
 * @param {string|null} mimeType
 * @returns {Array}
 */
export function buildVacancyMessages(vacancyPrompt, vacancyText, base64Data, mimeType) {
  if (base64Data && mimeType) {
    return [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          },
          { type: 'text', text: vacancyPrompt },
        ],
      },
    ]
  }

  return [
    {
      role: 'user',
      content: `${vacancyPrompt}\n\n---\n\n${vacancyText}`,
    },
  ]
}

/**
 * Build messages for CV analysis against requirements.
 * @param {string}      cvPrompt
 * @param {Array}       requirements
 * @param {string|null} cvText
 * @param {string|null} base64Data
 * @param {string|null} mimeType
 * @returns {Array}
 */
export function buildCvMessages(cvPrompt, requirements, cvText, base64Data, mimeType) {
  const requirementsJson = JSON.stringify(
    requirements.map((r) => ({ id: r.id, text: r.text, priority: r.priority })),
  )
  const promptWithRequirements = cvPrompt.replace('{{REQUIREMENTS}}', requirementsJson)

  if (base64Data && mimeType) {
    return [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          },
          { type: 'text', text: promptWithRequirements },
        ],
      },
    ]
  }

  return [
    {
      role: 'user',
      content: `${promptWithRequirements}\n\n---\n\n${cvText}`,
    },
  ]
}
