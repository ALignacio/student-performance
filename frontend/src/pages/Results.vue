<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12">
        <v-card class="app-surface-strong pa-6 mb-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Results</div>
              <h1 class="text-h4 font-weight-black section-title">Compare model quality and inspect the confusion matrix</h1>
            </div>
            <v-btn color="deep-orange-darken-2" variant="tonal" to="/train">
              Train or retrain models
            </v-btn>
          </div>

          <div class="text-body-1 text-medium-emphasis">
            The app summarizes the latest trained models and highlights which classifier performed best on the active dataset.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="app-surface pa-6 mb-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Model comparison</div>
              <h2 class="text-h5 font-weight-bold section-title">Accuracy bar chart</h2>
            </div>
            <v-chip color="teal-lighten-4" variant="tonal">
              Best: {{ bestResult?.label ?? 'No model yet' }}
            </v-chip>
          </div>

          <div v-if="comparisonRows.length" class="comparison-list">
            <div v-for="row in comparisonRows" :key="row.model" class="comparison-row">
              <div class="comparison-label">
                <span class="font-weight-medium">{{ row.label }}</span>
                <span class="text-caption text-medium-emphasis">{{ row.description }}</span>
              </div>
              <v-progress-linear :model-value="row.accuracy * 100" :color="row.color" height="18" rounded>
                <template #default>
                  <strong>{{ formatPercent(row.accuracy) }}</strong>
                </template>
              </v-progress-linear>
            </div>
          </div>
          <v-alert v-else type="info" variant="tonal">
            Train at least one model to see comparison charts.
          </v-alert>
        </v-card>

        <v-card class="app-surface pa-6">
          <div class="text-overline text-medium-emphasis mb-1">Confusion matrix</div>
          <h2 class="text-h5 font-weight-bold section-title mb-4">{{ selectedResult?.label ?? 'Select a trained model' }}</h2>

          <v-btn-toggle v-model="selectedModel" class="mb-4" divided mandatory>
            <v-btn v-for="result in trainedResults" :key="result.model" :value="result.model">
              {{ result.label }}
            </v-btn>
          </v-btn-toggle>

          <v-row v-if="selectedResult">
            <v-col cols="12" md="7">
              <div class="matrix-wrap">
                <div class="matrix-headers">Predicted PASS</div>
                <div class="matrix-headers">Predicted FAIL</div>

                <div class="matrix-row-label">Actual PASS</div>
                <div class="matrix-cell highlight-pass">{{ selectedResult.confusionMatrix.truePositive }}</div>
                <div class="matrix-cell highlight-fail">{{ selectedResult.confusionMatrix.falseNegative }}</div>

                <div class="matrix-row-label">Actual FAIL</div>
                <div class="matrix-cell highlight-fail">{{ selectedResult.confusionMatrix.falsePositive }}</div>
                <div class="matrix-cell highlight-pass">{{ selectedResult.confusionMatrix.trueNegative }}</div>
              </div>
            </v-col>
            <v-col cols="12" md="5">
              <v-list density="comfortable" class="bg-transparent pa-0">
                <v-list-item title="Accuracy" :subtitle="formatPercent(selectedResult.accuracy)" />
                <v-list-item title="Precision" :subtitle="formatPercent(selectedResult.precision)" />
                <v-list-item title="Recall" :subtitle="formatPercent(selectedResult.recall)" />
                <v-list-item title="F1 score" :subtitle="formatPercent(selectedResult.f1Score)" />
              </v-list>
              <v-alert class="mt-4" type="success" variant="tonal">
                {{ selectedResult.description }}
              </v-alert>
            </v-col>
          </v-row>
          <v-alert v-else type="info" variant="tonal">
            Pick a trained model to inspect its confusion matrix.
          </v-alert>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="app-surface pa-6 mb-6">
          <div class="text-overline text-medium-emphasis mb-1">At a glance</div>
          <h2 class="text-h5 font-weight-bold section-title mb-4">Best model summary</h2>

          <template v-if="bestResult">
            <v-chip :color="chipColor(bestResult.model)" variant="tonal" class="mb-4">
              {{ bestResult.label }} leads the board
            </v-chip>
            <v-list density="comfortable" class="bg-transparent pa-0">
              <v-list-item title="Accuracy" :subtitle="formatPercent(bestResult.accuracy)" />
              <v-list-item title="Threshold" :subtitle="bestResult.threshold.toFixed(1)" />
              <v-list-item title="Samples" :subtitle="bestResult.sampleCount.toString()" />
            </v-list>
          </template>
          <v-alert v-else type="warning" variant="tonal">
            No trained models yet. Run the training page first.
          </v-alert>
        </v-card>

        <v-card class="app-surface pa-6">
          <div class="text-overline text-medium-emphasis mb-1">Notes</div>
          <div class="text-body-2 text-medium-emphasis">
            These charts are generated entirely in the frontend, so the interface stays useful even before the backend API is connected.
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ModelName } from '@/lib/performance'

const store = useAppStore()
const selectedModel = ref<ModelName | null>(null)
const trainedResults = computed(() => store.trainedResults)
const bestResult = computed(() => store.bestResult)

const selectedResult = computed(() => {
  if (!selectedModel.value) {
    return bestResult.value ?? null
  }

  return store.results[selectedModel.value] ?? bestResult.value ?? null
})

const comparisonRows = computed(() =>
  trainedResults.value.map((result) => ({
    model: result.model,
    label: result.label,
    accuracy: result.accuracy,
    description: result.description,
    color: chipColor(result.model),
  })),
)

watchEffect(() => {
  if (!selectedModel.value && bestResult.value) {
    selectedModel.value = bestResult.value.model
  }
})

function chipColor(model: ModelName) {
  if (model === 'knn') return 'deep-orange-darken-2'
  if (model === 'svm') return 'teal-darken-2'
  return 'indigo-darken-2'
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
</script>

<style scoped>
.comparison-list {
  display: grid;
  gap: 18px;
}

.comparison-row {
  display: grid;
  gap: 8px;
}

.comparison-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.matrix-wrap {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 12px;
  align-items: stretch;
}

.matrix-headers,
.matrix-row-label,
.matrix-cell {
  border-radius: 16px;
  padding: 14px;
  text-align: center;
  font-weight: 700;
}

.matrix-headers,
.matrix-row-label {
  background: rgba(195, 107, 63, 0.12);
  color: rgb(121, 53, 28);
}

.matrix-row-label {
  display: flex;
  align-items: center;
  justify-content: center;
}

.highlight-pass {
  background: rgba(44, 160, 94, 0.12);
}

.highlight-fail {
  background: rgba(255, 130, 67, 0.12);
}
</style>
