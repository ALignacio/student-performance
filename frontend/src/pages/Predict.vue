<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="app-surface-strong pa-6 mb-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">Prediction</div>
              <h1 class="text-h4 font-weight-black section-title">Predict whether a student will PASS or FAIL</h1>
            </div>
            <v-chip :color="activeModelColor" variant="tonal">
              {{ activeModelLabel }}
            </v-chip>
          </div>

          <p class="text-body-1 text-medium-emphasis mb-6">
            Fill in the student profile, choose the model, and get a prediction backed by the currently loaded dataset.
          </p>

          <v-row>
            <v-col cols="12" md="4">
              <v-select v-model="form.gender" :items="options.gender" label="Gender" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="form.raceEthnicity" :items="options.raceEthnicity" label="Race / Ethnicity" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="form.parentalEducation" :items="options.parentalEducation" label="Parental Education" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="form.lunch" :items="options.lunch" label="Lunch" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="form.testPreparationCourse" :items="options.testPreparationCourse" label="Test Preparation" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="form.model" :items="modelChoices" label="Model" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="form.mathScore" label="Math Score" type="number" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="form.readingScore" label="Reading Score" type="number" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="form.writingScore" label="Writing Score" type="number" variant="outlined" />
            </v-col>
          </v-row>

          <div class="d-flex flex-wrap ga-3 mt-2">
            <v-btn color="deep-orange-darken-2" variant="flat" :loading="predicting" @click="predict">
              Predict outcome
            </v-btn>
            <v-btn color="grey-darken-1" variant="text" @click="resetForm">
              Reset
            </v-btn>
          </div>

          <v-alert v-if="prediction" class="mt-6" :type="prediction.label === 'PASS' ? 'success' : 'warning'" variant="tonal">
            Prediction: {{ prediction.label }} with {{ Math.round(prediction.probability * 100) }}% confidence.
          </v-alert>
        </v-card>

        <v-card class="app-surface pa-6">
          <div class="text-overline text-medium-emphasis mb-1">Model explanation</div>
          <h2 class="text-h5 font-weight-bold section-title mb-3">Why did the model decide that way?</h2>
          <div v-if="prediction" class="text-body-1 text-medium-emphasis">
            {{ prediction.rationale }}
          </div>
          <v-alert v-else type="info" variant="tonal">
            Run a prediction to see an explanation based on the active model.
          </v-alert>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="app-surface pa-6 mb-6">
          <div class="text-overline text-medium-emphasis mb-1">Active model</div>
          <h2 class="text-h5 font-weight-bold section-title mb-4">Best trained result</h2>

          <template v-if="bestResult">
            <v-list density="comfortable" class="bg-transparent pa-0">
              <v-list-item title="Model" :subtitle="bestResult.label" />
              <v-list-item title="Accuracy" :subtitle="formatPercent(bestResult.accuracy)" />
              <v-list-item title="Threshold" :subtitle="bestResult.threshold.toFixed(1)" />
            </v-list>
            <v-chip :color="activeModelColor" variant="tonal" class="mt-4">
              {{ bestResult.description }}
            </v-chip>
          </template>
          <v-alert v-else type="warning" variant="tonal">
            Train at least one model before using predictions.
          </v-alert>
        </v-card>

        <v-card class="app-surface pa-6">
          <div class="text-overline text-medium-emphasis mb-1">Dataset status</div>
          <h2 class="text-h5 font-weight-bold section-title mb-4">Current learning context</h2>

          <v-list density="comfortable" class="bg-transparent pa-0">
            <v-list-item title="Rows" :subtitle="store.summary.rows.toString()" />
            <v-list-item title="Average score" :subtitle="store.summary.averageScore.toFixed(1)" />
            <v-list-item title="Pass rate" :subtitle="formatPercent(store.summary.passRate)" />
          </v-list>

          <v-alert class="mt-4" type="info" variant="tonal">
            Predictions are computed in the frontend using the active dataset, so the form still works while your backend is being built.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ModelName, PredictionInput } from '@/lib/performance'

const store = useAppStore()
const predicting = ref(false)
const bestResult = computed(() => store.bestResult)

const options = computed(() => store.columnOptions)

const modelChoices = computed(() =>
  store.trainedResults.length
    ? store.trainedResults.map((result) => ({ title: result.label, value: result.model }))
    : [
        { title: 'KNN', value: 'knn' },
        { title: 'SVM', value: 'svm' },
        { title: 'ANN', value: 'ann' },
      ],
)

const defaultModel = computed<ModelName>(() => bestResult.value?.model ?? 'ann')

const form = reactive<PredictionInput & { model: ModelName }>({
  gender: 'female',
  raceEthnicity: 'group B',
  parentalEducation: "associate's degree",
  lunch: 'standard',
  testPreparationCourse: 'none',
  mathScore: 70,
  readingScore: 72,
  writingScore: 74,
  model: defaultModel.value,
})

const prediction = computed(() => store.latestPrediction)

const activeModelLabel = computed(() => bestResult.value?.label ?? 'No trained model yet')
const activeModelColor = computed(() => {
  const model = form.model
  if (model === 'knn') return 'deep-orange-darken-2'
  if (model === 'svm') return 'teal-darken-2'
  return 'indigo-darken-2'
})

watchEffect(() => {
  if (bestResult.value) {
    form.model = bestResult.value.model
  }
})

watchEffect(() => {
  const genderOptions = options.value.gender
  if (genderOptions.length && !genderOptions.includes(form.gender)) {
    form.gender = genderOptions[0]
  }

  const raceOptions = options.value.raceEthnicity
  if (raceOptions.length && !raceOptions.includes(form.raceEthnicity)) {
    form.raceEthnicity = raceOptions[0]
  }

  const parentOptions = options.value.parentalEducation
  if (parentOptions.length && !parentOptions.includes(form.parentalEducation)) {
    form.parentalEducation = parentOptions[0]
  }

  const lunchOptions = options.value.lunch
  if (lunchOptions.length && !lunchOptions.includes(form.lunch)) {
    form.lunch = lunchOptions[0]
  }

  const prepOptions = options.value.testPreparationCourse
  if (prepOptions.length && !prepOptions.includes(form.testPreparationCourse)) {
    form.testPreparationCourse = prepOptions[0]
  }
})

async function predict() {
  predicting.value = true
  try {
    await store.predictStudent(form)
  } finally {
    predicting.value = false
  }
}

function resetForm() {
  form.gender = options.value.gender[0] ?? 'female'
  form.raceEthnicity = options.value.raceEthnicity[0] ?? 'group B'
  form.parentalEducation = options.value.parentalEducation[0] ?? "associate's degree"
  form.lunch = options.value.lunch[0] ?? 'standard'
  form.testPreparationCourse = options.value.testPreparationCourse[0] ?? 'none'
  form.mathScore = 70
  form.readingScore = 72
  form.writingScore = 74
  form.model = defaultModel.value
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
</script>
