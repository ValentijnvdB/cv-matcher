<template>
  <div class="h-full flex flex-col">
    <VacancyInput class="flex-1 min-h-0" @applied="onApplied" />
  </div>
</template>

<script setup>
import { inject } from 'vue'
import VacancyInput from '@/components/vacancy/VacancyInput.vue'

const navigateTo = inject('navigateTo')

function onApplied() {
  navigateTo?.('requirements')
}
</script>
