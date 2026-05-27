<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="app-surface-strong pa-6 mb-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Upload dataset</div>
              <h1 class="text-h4 font-weight-black section-title">Import a CSV and preview the data immediately</h1>
            </div>
            <v-btn color="teal-darken-2" variant="tonal" @click="loadDemoDataset">
              Load demo data
            </v-btn>
          </div>

          <p class="text-body-1 text-medium-emphasis mb-6">
            The app accepts a student-performance CSV and normalizes the common column names automatically.
          </p>

          <v-file-input
            v-model="file"
            accept=".csv"
            label="Upload CSV file"
            prepend-icon="mdi-file-delimited-outline"
            variant="outlined"
            :loading="uploading"
            show-size
          />

          <div class="d-flex flex-wrap ga-3 mt-4">
            <v-btn color="deep-orange-darken-2" variant="flat" :loading="uploading" @click="uploadFile">
              Upload CSV
            </v-btn>
            <v-btn color="grey-darken-1" variant="text" @click="resetFile">
              Clear
            </v-btn>
          </div>

          <v-alert v-if="message" class="mt-6" :type="messageType" variant="tonal">
            {{ message }}
          </v-alert>
        </v-card>

        <v-card class="app-surface pa-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Live preview</div>
              <h2 class="text-h5 font-weight-bold section-title">First rows from the active dataset</h2>
            </div>
            <v-chip color="deep-orange-lighten-4" variant="tonal">
              {{ store.summary.rows }} rows ready
            </v-chip>
          </div>

          <v-data-table
            :headers="headers"
            :items="previewRows"
            density="comfortable"
            hover
            item-value="mathScore"
          />
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="app-surface pa-6 h-100">
          <div class="text-overline text-medium-emphasis mb-1">Supported columns</div>
          <h2 class="text-h5 font-weight-bold section-title mb-4">What the parser expects</h2>

          <v-list density="compact" class="bg-transparent pa-0">
            <v-list-item v-for="field in fields" :key="field.title" :title="field.title" :subtitle="field.subtitle" />
          </v-list>

          <v-divider class="my-5" />

          <div class="text-overline text-medium-emphasis mb-2">Tips</div>
          <v-alert type="info" variant="tonal" class="mb-4">
            You can upload a new CSV at any time. The dashboard, training page, and prediction form update from the same state.
          </v-alert>

          <v-alert type="success" variant="tonal">
            Demo mode is already filled with a sample student-performance dataset, so the app works before your backend is connected.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { formatHeaderLabel } from '@/lib/csv'

const store = useAppStore()
const file = ref<File[] | File | null>(null)
const uploading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('success')

const headers = computed(() => store.tableHeaders.map((header) => ({ title: formatHeaderLabel(header.key), key: header.key })))
const previewRows = computed(() => store.previewRows)

const fields = [
  { title: 'Student identity', subtitle: 'Gender, race / ethnicity, and parental education' },
  { title: 'Learning context', subtitle: 'Lunch type and test preparation status' },
  { title: 'Performance scores', subtitle: 'Math, reading, writing, and total score' },
]

function resetFile() {
  file.value = null
  message.value = ''
}

async function loadDemoDataset() {
  await store.loadDemoDataset()
  messageType.value = 'success'
  message.value = 'Demo dataset loaded. You can train models right away.'
}

async function uploadFile() {
  const candidate = Array.isArray(file.value) ? file.value[0] : file.value

  if (!candidate) {
    messageType.value = 'error'
    message.value = 'Choose a CSV file first.'
    return
  }

  uploading.value = true

  try {
    await store.loadCsv(candidate)
    messageType.value = 'success'
    message.value = `Loaded ${candidate.name} successfully.`
  } catch (error) {
    messageType.value = 'error'
    message.value = error instanceof Error ? error.message : 'Unable to parse that file.'
  } finally {
    uploading.value = false
  }
}
</script>
