<template>
  <v-app class="app-shell">
    <v-navigation-drawer v-model="drawer" :permanent="!mobile" :temporary="mobile" width="280">
      <div class="pa-5 pb-4">
        <div class="text-overline text-medium-emphasis">Student Performance Lab</div>
        <div class="text-h5 font-weight-black mt-1">ML classroom</div>
        <div class="text-body-2 text-medium-emphasis mt-2">
          Upload, train, compare, and predict in one polished interface.
        </div>
      </div>

      <v-list nav density="comfortable">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          color="deep-orange-darken-2"
          rounded="xl"
        />
      </v-list>

      <template #append>
        <div class="pa-4">
          <v-card class="app-surface pa-4">
            <div class="text-caption text-medium-emphasis">Active page</div>
            <div class="text-subtitle-2 font-weight-bold">{{ currentTitle }}</div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              {{ currentSubtitle }}
            </div>
          </v-card>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar class="app-bar" elevation="0" rounded>
      <v-app-bar-nav-icon class="d-flex d-lg-none" @click="drawer = !drawer" />
      <v-toolbar-title class="font-weight-bold">Student Performance Prediction</v-toolbar-title>
      <v-spacer />
      <v-chip class="me-2 d-none d-sm-flex" color="deep-orange-lighten-4" variant="tonal">
        {{ latestRows }} rows
      </v-chip>
      <v-chip color="teal-lighten-4" variant="tonal" class="d-none d-md-flex">
        {{ latestAccuracy }} accuracy
      </v-chip>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'

const store = useAppStore()
const route = useRoute()
const { mobile } = useDisplay()
const drawer = ref(!mobile.value)

const navItems = [
  { title: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
  { title: 'Upload Dataset', to: '/upload', icon: 'mdi-file-upload-outline' },
  { title: 'Train Models', to: '/train', icon: 'mdi-creation-outline' },
  { title: 'Results', to: '/results', icon: 'mdi-chart-line' },
  { title: 'Predict', to: '/predict', icon: 'mdi-crystal-ball' },
]

const currentTitle = computed(() => (route.meta.title as string | undefined) ?? 'Dashboard')
const currentSubtitle = computed(() => {
  if (route.name === 'upload') return 'Add a CSV and refresh the learning workspace.'
  if (route.name === 'train') return 'Run the three model profiles and compare their metrics.'
  if (route.name === 'results') return 'Inspect the confusion matrix and accuracy comparison.'
  if (route.name === 'predict') return 'Fill the student profile and generate PASS / FAIL predictions.'
  return 'See dataset coverage, metrics, and navigation in one place.'
})

const latestRows = computed(() => store.summary.rows)
const latestAccuracy = computed(() => {
  const result = store.latestResult
  return result ? `${Math.round(result.accuracy * 100)}%` : '—'
})

watch(mobile, (value) => {
  drawer.value = !value
})
</script>
