<template>
  <div class="max-w-2xl space-y-6">
    <h2 class="text-base font-semibold text-gray-900">How does it work?</h2>

    <div class="space-y-4">
      <div v-for="step in steps" :key="step.number" class="card p-4 flex gap-4">
        <div class="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {{ step.number }}
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900 mb-1">{{ step.title }}</h3>
          <p class="text-sm text-gray-600 leading-relaxed">{{ step.description }}</p>
        </div>
      </div>
    </div>

    <!-- Categories legend -->
    <div class="card p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Match categories</h3>
      <div class="space-y-2">
        <div v-for="cat in categories" :key="cat.key" class="flex items-center gap-3">
          <div :class="cat.css" class="category-badge text-xs">{{ cat.letters }}</div>
          <div>
            <span class="text-sm font-medium text-gray-800">{{ cat.label }}</span>
            <span class="text-xs text-gray-400 ml-2">{{ cat.desc }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Score legend -->
    <div class="card p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Requirement scores</h3>
      <div class="space-y-2">
        <div v-for="score in scores" :key="score.value" class="flex items-center gap-3">
          <div :class="score.css" class="w-3.5 h-3.5 rounded-sm flex-shrink-0" />
          <span class="text-sm text-gray-700">{{ score.label }}</span>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p class="text-sm text-amber-800 leading-relaxed">
        <strong>Note:</strong> The AI analysis is a supporting tool only. All final hiring decisions remain the responsibility of the recruiter. The match score is an indication — not a verdict.
      </p>
    </div>
  </div>
</template>

<script setup>
const steps = [
  {
    number: 1,
    title: 'Configure your LLM provider',
    description: 'Go to the Settings -> Connections and select your provider, fill in your API key and test the connection.',
  },
  {
    number: 2,
    title: 'Upload the vacancy',
    description: 'Go to the Vacancy tab and paste the job description as text, or upload it as a PDF, image, or text file.',
  },
  {
    number: 3,
    title: 'Extract requirements',
    description: 'Click "Apply" to send the vacancy to the AI. It will return a list of requirements for your ideal candidate. You can review these, adjust priorities (must have / should have / nice to have), and edit or delete individual items under the Requirements tab.',
  },
  {
    number: 4,
    title: 'Upload CVs',
    description: 'Go to the CVs tab and upload one or more candidate CVs (PDF, image, or text). You can add as many as you need.',
  },
  {
    number: 5,
    title: 'Analyze',
    description: 'Click "Analyze" on a CV, or "Analyze all" to process them one by one. The AI checks each CV against every requirement and assigns a score per item.',
  },
  {
    number: 6,
    title: 'Review the results',
    description: 'Each CV is placed in a match category based on the weighted total score. You can click any CV to see exactly which requirements were found, partially found, or missing. Expand a requirement to see the AIs reasoning for assigning a score.',
  },
  {
    number: 7,
    title: 'Export & share',
    description: 'Use the export button (top right) to save the full session as a JSON file. You or a colleague can import this file to continue where you left off.',
  },
]

const categories = [
  { key: 'excellent', letters: 'E',  css: 'category-excellent', label: 'Excellent match',  desc: 'Strong fit across all priority levels' },
  { key: 'good',      letters: 'G',  css: 'category-good',      label: 'Good match',       desc: 'Meets most key requirements' },
  { key: 'fair',      letters: 'F',  css: 'category-fair',      label: 'Fair match',       desc: 'Meets some requirements; gaps present' },
  { key: 'none',      letters: 'N',  css: 'category-none',      label: 'No match',         desc: 'Too few requirements met' },
]

const scores = [
  { value: 1,  css: 'bg-match-excellent', label: 'Clearly present in the CV' },
  { value: 0,  css: 'bg-match-fair',      label: 'Partially present or implied' },
  { value: -1, css: 'bg-score-low',       label: 'Not found in the CV' },
]
</script>
