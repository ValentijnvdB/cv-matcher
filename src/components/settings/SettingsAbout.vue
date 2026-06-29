<script setup>
</script>
<template>
  <div class="max-w-md space-y-5">
    <h2 class="text-base font-semibold text-gray-900">About</h2>

    <div class="card p-5 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-gray-900">CV Matcher</p>
          <p class="text-xs text-gray-400">AI-powered CV–vacancy matching demo</p>
        </div>
      </div>

      <p class="text-sm text-gray-600 leading-relaxed">
        This tool helps recruiters make faster and more consistent pre-selections by automatically matching candidate CVs against vacancy requirements using a large language model.
      </p>

      <div class="border-t border-gray-100 pt-4 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">How data is stored</span>
          <span class="text-gray-700 font-medium">Entirely in your browser</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">Files (PDFs, images)</span>
          <span class="text-gray-700 font-medium">IndexedDB</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">Settings & API keys</span>
          <span class="text-gray-700 font-medium">localStorage</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">No backend or tracking</span>
          <span class="text-gray-700 font-medium">✓</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">Source code</span>
          <span class="text-gray-700 font-medium">https://github.com/ValentijnvdB/cv-matcher</span>
        </div>
      </div>

      <div class="border-t border-gray-100 pt-4">
        <p class="text-xs text-gray-400 leading-relaxed">
          The AI provides a supporting analysis only. All hiring decisions remain the responsibility of the recruiter. The tool scores candidates against requirements — it does not decide who advances.
        </p>
      </div>
    </div>
  </div>
</template>
