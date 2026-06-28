<template>
  <div class="space-y-6 max-w-lg">
    <h2 class="text-base font-semibold text-gray-900">Connections</h2>

    <div class="card p-4 space-y-4">
      <!-- Provider selector -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1.5">LLM provider</label>
        <div class="flex gap-2">
          <button
            v-for="p in providers"
            :key="p.value"
            class="flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all duration-150"
            :class="settings.provider === p.value
              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'"
            @click="settings.provider = p.value"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- OpenAI fields -->
      <template v-if="settings.provider === 'openai'">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1.5">API key</label>
          <input
            v-model="current.apiKey"
            type="password"
            class="input font-mono text-sm"
            placeholder="sk-…"
            autocomplete="off"
          />
          <p class="text-xs text-gray-400 mt-1">
            Stored only in your browser's localStorage and never sent to any server other than OpenAI.
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1.5">Model</label>
          <select v-model="current.model" class="select text-sm">
            <option value="">Default (gpt-4o-mini)</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4-turbo">gpt-4-turbo</option>
          </select>
        </div>
      </template>

      <!-- Ollama fields -->
      <template v-if="settings.provider === 'ollama'">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1.5">Base URL</label>
          <input
            v-model="current.ollamaBaseUrl"
            type="text"
            class="input text-sm font-mono"
            placeholder="http://localhost:11434"
          />
          <p class="text-xs text-gray-400 mt-1">
            The address of your local Ollama instance.
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1.5">Model</label>
          <input
            v-model="current.model"
            type="text"
            class="input text-sm font-mono"
            placeholder="llama3.2"
          />
          <p class="text-xs text-gray-400 mt-1">
            The name of the Ollama model to use (e.g. <code class="font-mono">llama3.2</code>, <code class="font-mono">mistral</code>).
          </p>
        </div>
      </template>

      <!-- Anthropic fields -->
      <template v-if="settings.provider === 'anthropic'">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1.5">API key</label>
          <input
            v-model="current.apiKey"
            type="password"
            class="input font-mono text-sm"
            placeholder="sk-ant-…"
            autocomplete="off"
          />
          <p class="text-xs text-gray-400 mt-1">
            Stored only in your browser's localStorage and never sent to any server other than Anthropic.
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1.5">Model</label>
          <select v-model="current.model" class="select text-sm">
            <option value="">Default (Claude Sonnet 4.6)</option>
            <option value="claude-fable-5">Claude Fable 5</option>
            <option value="claude-mythos-5">Claude Mythos 5</option>
            <option value="claude-opus-4-8">Claude Opus 4.8</option>
            <option value="claude-opus-4-7">Claude Opus 4.7</option>
            <option value="claude-opus-4-6">Claude Opus 4.6</option>
            <option value="claude-opus-4-5">Claude Opus 4.5</option>
            <option value="claude-opus-4-1">Claude Opus 4.1</option>
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
            <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
          </select>
        </div>
      </template>

      <!-- Test connection button -->
      <div class="pt-2 border-t border-gray-100 flex items-center gap-3">
        <button
          class="btn-secondary text-xs"
          :disabled="testing"
          @click="testConnection"
        >
          <svg v-if="testing" class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ testing ? 'Testing…' : 'Test connection' }}
        </button>
        <span v-if="testResult" class="text-xs" :class="testResult.ok ? 'text-green-600' : 'text-red-600'">
          {{ testResult.message }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { llmChat } from '@/services/llm'

const settings = useSettingsStore()

const providers = [
  { value: 'openai',    label: 'OpenAI' },
  { value: 'ollama',    label: 'Ollama' },
  { value: 'anthropic', label: 'Anthropic' },
]

// Reactive shorthand for the active provider's settings object
const current = computed(() => settings.providerSettings[settings.provider])

const testing = ref(false)
const testResult = ref(null)

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    const response = await llmChat({
      provider: settings.provider,
      settings: settings.getProviderSettings(),
      messages: [{ role: 'user', content: 'Reply with only the word "OK".' }],
    })
    testResult.value = { ok: true, message: `Connected ✓ (response: "${response.trim().slice(0, 40)}")` }
  } catch (err) {
    testResult.value = { ok: false, message: err.message }
  } finally {
    testing.value = false
  }
}
</script>
