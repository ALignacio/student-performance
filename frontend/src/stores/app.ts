import { defineStore } from 'pinia'

import { demoDatasetName, demoStudents, type StudentRecord } from '@/data/demoDataset'
import { formatHeaderLabel, parseCsv } from '@/lib/csv'
import {
  buildSummary,
  getColumnOptions,
  predictStudent as predictStudentResult,
  trainModel as trainModelResult,
  type ModelMetrics,
  type ModelName,
  type PredictionInput,
} from '@/lib/performance'

export interface PredictionState {
  model: ModelName
  label: 'PASS' | 'FAIL'
  probability: number
  rationale: string
}

function toNumber(value: string | number | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeRows(rows: Record<string, string>[]): StudentRecord[] {
  return rows.map((row) => {
    const mathScore = toNumber(row.mathScore)
    const readingScore = toNumber(row.readingScore)
    const writingScore = toNumber(row.writingScore)

    return {
      gender: row.gender || 'female',
      raceEthnicity: row.raceEthnicity || 'group B',
      parentalEducation: row.parentalEducation || 'high school',
      lunch: row.lunch || 'standard',
      testPreparationCourse: row.testPreparationCourse || 'none',
      mathScore,
      readingScore,
      writingScore,
      totalScore: toNumber(row.totalScore) || mathScore + readingScore + writingScore,
    }
  })
}

export const useAppStore = defineStore('app', {
  state: () => ({
    datasetName: demoDatasetName,
    rows: demoStudents as StudentRecord[],
    results: {} as Partial<Record<ModelName, ModelMetrics>>,
    latestPrediction: null as PredictionState | null,
    lastTrainedModel: null as ModelName | null,
  }),

  getters: {
    headers: (state) => Object.keys(state.rows[0] ?? {}),
    tableHeaders: (state) => Object.keys(state.rows[0] ?? {}).map((key) => ({
      key,
      title: formatHeaderLabel(key),
    })),
    previewRows: (state) => state.rows.slice(0, 8),
    summary: (state) => buildSummary(state.rows),
    columnOptions: (state) => getColumnOptions(state.rows),
    trainedResults: (state) => Object.values(state.results)
      .filter((value): value is ModelMetrics => Boolean(value))
      .sort((left, right) => right.accuracy - left.accuracy),
    bestResult: (state) => {
      const values = Object.values(state.results).filter((value): value is ModelMetrics => Boolean(value))
      return values.sort((left, right) => right.accuracy - left.accuracy)[0] ?? null
    },
    latestResult: (state) => {
      if (state.lastTrainedModel && state.results[state.lastTrainedModel]) {
        return state.results[state.lastTrainedModel] ?? null
      }

      const values = Object.values(state.results).filter((value): value is ModelMetrics => Boolean(value))
      return values[0] ?? null
    },
  },

  actions: {
    async loadDemoDataset() {
      this.datasetName = demoDatasetName
      this.rows = demoStudents as StudentRecord[]
      this.results = {}
      this.latestPrediction = null
      this.lastTrainedModel = null
    },

    async loadCsv(file: File) {
      const rawText = await file.text()
      const parsedRows = parseCsv(rawText)

      if (!parsedRows.length) {
        throw new Error('The CSV did not contain any data rows.')
      }

      this.datasetName = file.name
      this.rows = normalizeRows(parsedRows)
      this.results = {}
      this.latestPrediction = null
      this.lastTrainedModel = null
    },

    async trainModel(model: ModelName) {
      if (!this.rows.length) {
        await this.loadDemoDataset()
      }

      const result = trainModelResult(this.rows, model)
      this.results[model] = result
      this.lastTrainedModel = model
      return result
    },

    predictStudent(input: PredictionInput & { model?: ModelName }) {
      const model = input.model ?? this.bestResult?.model ?? this.lastTrainedModel ?? 'ann'
      const result = predictStudentResult(this.rows, input, model)

      this.latestPrediction = {
        model,
        ...result,
      }

      return this.latestPrediction
    },
  },
})
