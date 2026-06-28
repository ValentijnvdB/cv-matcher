<template>
  <div class="space-y-6 max-w-2xl">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900">Prompts</h2>
      <button class="btn-secondary text-xs" @click="settings.resetPrompts()">
        Reset to defaults
      </button>
    </div>

    <div class="card p-4 space-y-2">
      <label class="block text-xs font-medium text-gray-700">
        Vacancy prompt
      </label>
      <p class="text-xs text-gray-400">
        Sent to the LLM to extract requirements from the vacancy. The vacancy content is appended after this prompt.
      </p>
      <textarea
        v-model="settings.vacancyPrompt"
        class="input font-mono text-xs leading-relaxed resize-none"
        rows="10"
      />
    </div>

    <div class="card p-4 space-y-2">
      <label class="block text-xs font-medium text-gray-700">
        CV prompt
      </label>
      <p class="text-xs text-gray-400">
        Sent to the LLM to score each requirement against a CV.
        Use <code class="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">&#123;&#123;REQUIREMENTS&#125;&#125;</code>
        as a placeholder — it will be replaced with the requirements JSON.
        The CV content is appended after this prompt.
      </p>
      <textarea
        v-model="settings.cvPrompt"
        class="input font-mono text-xs leading-relaxed resize-none"
        rows="14"
      />
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings'
const settings = useSettingsStore()
</script>
