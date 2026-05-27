<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12">
        <v-card class="app-surface-strong pa-6 mb-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Model training</div>
              <h1 class="text-h4 font-weight-black section-title">Train KNN, SVM, or ANN on the active dataset</h1>
            </div>
            <v-chip color="teal-lighten-4" variant="tonal">
              {{ store.summary.rows }} rows available
            </v-chip>
          </div>

          <p class="text-body-1 text-medium-emphasis mb-0">
            Each button runs the same dataset through a different classifier profile and stores the metrics for comparison.
          </p>
        </v-card>
      </v-col>

      <v-col v-for="model in models" :key="model.name" cols="12" md="4">
        <v-card class="app-surface pa-5 h-100 model-card">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar :color="model.color" variant="tonal">
              <v-icon :icon="model.icon" :color="model.color" />
            </v-avatar>
            <v-chip :color="model.color" variant="tonal">
              {{ model.label }}
            </v-chip>
          </div>

          <h2 class="text-h5 font-weight-bold mb-2">{{ model.title }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-5">{{ model.description }}</p>

          <v-btn block :color="model.color" :loading="loadingModel === model.name" variant="flat" @click="train(model.name)">
            Train {{ model.label }}
          </v-btn>

          <v-divider class="my-5" />

          <template v-if="results[model.name]">
            <div class="text-overline text-medium-emphasis mb-2">Latest metrics</div>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-chip variant="tonal">Accuracy {{ formatPercent(results[model.name]!.accuracy) }}</v-chip>
              <v-chip variant="tonal">F1 {{ formatPercent(results[model.name]!.f1Score) }}</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">
              Threshold: {{ results[model.name]!.threshold.toFixed(1) }}
            </div>
          </template>
          <template v-else>
            <div class="text-body-2 text-medium-emphasis">No training run yet for this model.</div>
          </template>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card class="app-surface pa-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Results snapshot</div>
              <h2 class="text-h5 font-weight-bold section-title">Confusion matrix and summary</h2>
            </div>
            <v-btn color="indigo-darken-2" variant="tonal" to="/results">
              Open results page
            </v-btn>
          </div>

          <v-alert v-if="lastMessage" :type="lastMessageType" variant="tonal" class="mb-6">
            {{ lastMessage }}
          </v-alert>

          <v-row>
            <v-col v-for="result in trainedResults" :key="result.model" cols="12" md="4">
              <v-card class="app-surface-strong pa-4 h-100">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="text-subtitle-1 font-weight-bold">{{ result.label }}</div>
                  <v-chip :color="chipColor(result.model)" variant="tonal">{{ formatPercent(result.accuracy) }}</v-chip>
                </div>
                <div class="matrix-grid mb-3">
                  <div class="matrix-cell matrix-label">TP</div>
                  <div class="matrix-cell">{{ result.confusionMatrix.truePositive }}</div>
                  <div class="matrix-cell matrix-label">FP</div>
                  <div class="matrix-cell">{{ result.confusionMatrix.falsePositive }}</div>
                  <div class="matrix-cell matrix-label">FN</div>
                  <div class="matrix-cell">{{ result.confusionMatrix.falseNegative }}</div>
                  <div class="matrix-cell matrix-label">TN</div>
                  <div class="matrix-cell">{{ result.confusionMatrix.trueNegative }}</div>
                </div>
                <div class="text-body-2 text-medium-emphasis">{{ result.description }}</div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ModelName } from '@/lib/performance'

const store = useAppStore()
const loadingModel = ref<ModelName | null>(null)
const lastMessage = ref('')
const lastMessageType = ref<'success' | 'error' | 'info'>('info')

const models = [
  {
    name: 'knn' as const,
    label: 'KNN',
    title: 'Nearest-neighbor baseline',
    description: 'Good for quick comparisons and simple decision boundaries.',
    icon: 'mdi-ray-start-arrow',
    color: 'deep-orange-darken-2',
  },
  {
    name: 'svm' as const,
    label: 'SVM',
    title: 'Linear margin model',
    description: 'Balances the profile around the learned separation boundary.',
    icon: 'mdi-vector-line',
    color: 'teal-darken-2',
  },
  {
    name: 'ann' as const,
    label: 'ANN',
    title: 'Nonlinear scoring network',
    description: 'Adds a soft, weighted layer that favors balanced performance.',
    icon: 'mdi-brain',
    color: 'indigo-darken-2',
  },
]

const results = computed(() => store.results)
const trainedResults = computed(() => store.trainedResults)

async function train(model: ModelName) {
  loadingModel.value = model
  try {
    const result = await store.trainModel(model)
    lastMessageType.value = 'success'
    lastMessage.value = `${result.label} trained successfully. Accuracy: ${formatPercent(result.accuracy)}.`
  } catch (error) {
    lastMessageType.value = 'error'
    lastMessage.value = error instanceof Error ? error.message : 'Training failed.'
  } finally {
    loadingModel.value = null
  }
}

function chipColor(model: ModelName) {
  if (model === 'knn') return 'deep-orange'
  if (model === 'svm') return 'teal'
  return 'indigo'
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
</script>

<style scoped>
.model-card {
  min-height: 100%;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.matrix-cell {
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.75);
  text-align: center;
  font-weight: 700;
}

.matrix-label {
  background: rgba(195, 107, 63, 0.1);
  color: rgb(121, 53, 28);
}
</style>
