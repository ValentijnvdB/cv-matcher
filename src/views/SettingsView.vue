<template>
  <div class="flex gap-6 h-full">
    <!-- Left sidebar -->
    <div class="w-44 flex-shrink-0">
      <nav class="space-y-0.5">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150"
          :class="active === item.id
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
          @click="active = item.id"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>

    <!-- Right content -->
    <div class="flex-1 min-w-0 overflow-y-auto">
      <SettingsGeneral v-if="active === 'general'" />
      <SettingsConnections v-else-if="active === 'connections'" />
      <SettingsPrompts v-else-if="active === 'prompts'" />
      <SettingsAbout v-else-if="active === 'about'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SettingsGeneral from '@/components/settings/SettingsGeneral.vue'
import SettingsConnections from '@/components/settings/SettingsConnections.vue'
import SettingsPrompts from '@/components/settings/SettingsPrompts.vue'
import SettingsAbout from '@/components/settings/SettingsAbout.vue'

const active = ref('general')

const navItems = [
  { id: 'general',     label: 'General' },
  { id: 'connections', label: 'Connections' },
  { id: 'prompts',     label: 'Prompts' },
  { id: 'about',       label: 'About' },
]
</script>
