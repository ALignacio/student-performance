<template>
  <v-container class="py-8">
    <v-row class="mb-6" align="stretch">
      <v-col cols="12" lg="8">
        <v-card class="app-surface-strong hero-card pa-6 pa-md-8 h-100">
          <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <v-chip color="deep-orange-lighten-3" text-color="deep-orange-darken-4" variant="tonal">
              Student Performance Lab
            </v-chip>
            <v-chip color="teal-lighten-3" text-color="teal-darken-4" variant="tonal">
              Offline demo ready
            </v-chip>
          </div>

          <h1 class="text-h3 text-md-h2 font-weight-black mb-3">
            Predict student outcomes with a cleaner, guided workflow.
          </h1>
          <p class="text-body-1 text-medium-emphasis mb-6 hero-copy">
            Upload a CSV, inspect the data, train KNN, SVM, or ANN, and generate PASS / FAIL predictions from a single workspace.
          </p>

          <div class="d-flex flex-wrap ga-3">
            <v-btn color="deep-orange-darken-2" size="large" variant="flat" to="/upload">
              Upload CSV
            </v-btn>
            <v-btn color="teal-darken-2" size="large" variant="tonal" to="/train">
              Train models
            </v-btn>
            <v-btn color="grey-darken-2" size="large" variant="text" to="/predict">
              Predict outcome
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="app-surface-strong pa-6 h-100 dashboard-aside">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Dataset</div>
              <div class="text-h6 font-weight-bold">Current overview</div>
            </div>
            <v-avatar color="deep-orange-lighten-4" size="48">
              <v-icon icon="mdi-chart-box-outline" color="deep-orange-darken-3" />
            </v-avatar>
          </div>

          <v-list density="compact" class="bg-transparent pa-0">
            <v-list-item title="Rows" :subtitle="summary.rows" />
            <v-list-item title="Average score" :subtitle="summary.averageScore.toFixed(1)" />
            <v-list-item title="Pass rate" :subtitle="formatPercent(summary.passRate)" />
            <v-list-item title="Threshold" :subtitle="summary.scoreThreshold.toFixed(1)" />
          </v-list>

          <v-divider class="my-4" />

          <div class="text-caption text-medium-emphasis mb-2">Latest training status</div>
          <div v-if="latestResult" class="d-flex flex-column ga-3">
            <v-chip :color="modelChipColor(latestResult.model)" variant="tonal" class="align-self-start">
              {{ latestResult.label }} ready
            </v-chip>
            <div class="text-body-2 text-medium-emphasis">
              {{ latestResult.description }}
            </div>
            <div class="d-flex align-center ga-2">
              <v-progress-linear
                :model-value="latestResult.accuracy * 100"
                color="deep-orange-darken-2"
                height="10"
                rounded
              />
              <span class="text-caption font-weight-medium">{{ formatPercent(latestResult.accuracy) }}</span>
            </div>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">
            Train one of the models to see live metrics here.
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col v-for="card in insightCards" :key="card.title" cols="12" md="6" xl="3">
        <v-card class="app-surface pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-overline text-medium-emphasis">{{ card.title }}</span>
            <v-icon :icon="card.icon" :color="card.color" />
          </div>
          <div class="text-h5 font-weight-bold mb-2">{{ card.value }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ card.subtitle }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="app-surface pa-5">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Preview</div>
              <h2 class="text-h5 font-weight-bold section-title">Dataset snapshot</h2>
            </div>
            <v-btn color="deep-orange-darken-2" variant="tonal" to="/upload">
              Replace dataset
            </v-btn>
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

      <v-col cols="12" lg="4">
        <v-card class="app-surface pa-5 h-100">
          <div class="text-overline text-medium-emphasis mb-1">Workflow</div>
          <h2 class="text-h5 font-weight-bold section-title mb-4">What happens next</h2>

          <v-timeline density="compact" side="end">
            <v-timeline-item dot-color="deep-orange-darken-2" size="small">
              <div class="text-subtitle-2 font-weight-medium">Upload CSV</div>
              <div class="text-body-2 text-medium-emphasis">Bring in a new class dataset or keep using the demo sample.</div>
            </v-timeline-item>
            <v-timeline-item dot-color="teal-darken-2" size="small">
              <div class="text-subtitle-2 font-weight-medium">Train models</div>
              <div class="text-body-2 text-medium-emphasis">Compare KNN, SVM, and ANN side by side.</div>
            </v-timeline-item>
            <v-timeline-item dot-color="indigo-darken-2" size="small">
              <div class="text-subtitle-2 font-weight-medium">Predict outcomes</div>
              <div class="text-body-2 text-medium-emphasis">Use the best model to estimate PASS / FAIL for a new student.</div>
            </v-timeline-item>
          </v-timeline>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { formatHeaderLabel } from '@/lib/csv'

const store = useAppStore()
const summary = computed(() => store.summary)
const latestResult = computed(() => store.latestResult)
const previewRows = computed(() => store.previewRows)
const headers = computed(() => store.tableHeaders.map((header) => ({ title: formatHeaderLabel(header.key), key: header.key })))

const insightCards = computed(() => [
  {
    title: 'Rows loaded',
    value: store.summary.rows.toString(),
    subtitle: 'Source data available to the app',
    icon: 'mdi-database-outline',
    color: 'deep-orange-darken-2',
  },
  {
    title: 'Features',
    value: '8',
    subtitle: 'Categorical + numeric student attributes',
    icon: 'mdi-shape-outline',
    color: 'teal-darken-2',
  },
  {
    title: 'Average score',
    value: store.summary.averageScore.toFixed(1),
    subtitle: 'Mean combined score across the dataset',
    icon: 'mdi-trending-up',
    color: 'indigo-darken-2',
  },
  {
    title: 'Pass rate',
    value: `${Math.round(store.summary.passRate * 100)}%`,
    subtitle: 'Students at or above the learned threshold',
    icon: 'mdi-check-decagram-outline',
    color: 'green-darken-2',
  },
])

function modelChipColor(model: string) {
  if (model === 'knn') return 'deep-orange'
  if (model === 'svm') return 'teal'
  return 'indigo'
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
</script>

<style scoped>
.hero-card {
  background:
    radial-gradient(circle at top right, rgba(195, 107, 63, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 248, 239, 0.88));
}

.hero-copy {
  max-width: 62ch;
}

.dashboard-aside {
  border-left: 4px solid rgba(195, 107, 63, 0.3);
}
</style>
