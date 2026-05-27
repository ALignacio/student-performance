import { demoStudents, type StudentRecord } from '@/data/demoDataset'

export type ModelName = 'knn' | 'svm' | 'ann'
export type PredictionLabel = 'PASS' | 'FAIL'

export interface ConfusionMatrix {
  truePositive: number
  falsePositive: number
  trueNegative: number
  falseNegative: number
}

export interface ModelMetrics {
  model: ModelName
  label: string
  description: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  confusionMatrix: ConfusionMatrix
  threshold: number
  sampleCount: number
}

export interface PredictionInput {
  gender: string
  raceEthnicity: string
  parentalEducation: string
  lunch: string
  testPreparationCourse: string
  mathScore: number | string
  readingScore: number | string
  writingScore: number | string
}

export interface DatasetSummary {
  rows: number
  passRate: number
  averageScore: number
  scoreThreshold: number
  topScore: number
  bottomScore: number
  bestFeature: string
}

const CATEGORICAL_COLUMNS = [
  'gender',
  'raceEthnicity',
  'parentalEducation',
  'lunch',
  'testPreparationCourse',
] as const

const NUMERIC_COLUMNS = ['mathScore', 'readingScore', 'writingScore'] as const

const MODEL_META: Record<ModelName, { label: string; description: string }> = {
  knn: {
    label: 'KNN',
    description: 'Neighborhood-based baseline that compares each student to nearby profiles.',
  },
  svm: {
    label: 'SVM',
    description: 'A linear separator inspired by margin-based classification.',
  },
  ann: {
    label: 'ANN',
    description: 'A nonlinear scoring network that rewards strong balanced performance.',
  },
}

export function getDemoStudents(): StudentRecord[] {
  return demoStudents
}

export function getScore(student: Pick<StudentRecord, 'mathScore' | 'readingScore' | 'writingScore' | 'totalScore'>): number {
  if (typeof student.totalScore === 'number' && Number.isFinite(student.totalScore)) {
    return student.totalScore
  }

  return student.mathScore + student.readingScore + student.writingScore
}

export function getThreshold(rows: StudentRecord[]): number {
  const scores = rows.map((row) => getScore(row)).sort((left, right) => left - right)
  if (!scores.length) {
    return 0
  }

  const middle = Math.floor(scores.length / 2)
  return scores.length % 2 === 0 ? (scores[middle - 1] + scores[middle]) / 2 : scores[middle]
}

export function buildSummary(rows: StudentRecord[]): DatasetSummary {
  const scores = rows.map((row) => getScore(row))
  const threshold = getThreshold(rows)
  const passCount = scores.filter((score) => score >= threshold).length
  const averageScore = scores.length ? scores.reduce((total, value) => total + value, 0) / scores.length : 0

  return {
    rows: rows.length,
    passRate: scores.length ? passCount / scores.length : 0,
    averageScore,
    scoreThreshold: threshold,
    topScore: scores.length ? Math.max(...scores) : 0,
    bottomScore: scores.length ? Math.min(...scores) : 0,
    bestFeature: 'Average of math, reading and writing scores',
  }
}

export function getOptions(rows: StudentRecord[], key: keyof StudentRecord): string[] {
  return Array.from(new Set(rows.map((row) => String(row[key])))).sort((left, right) => left.localeCompare(right))
}

export function getColumnOptions(rows: StudentRecord[]): Record<string, string[]> {
  return {
    gender: getOptions(rows, 'gender'),
    raceEthnicity: getOptions(rows, 'raceEthnicity'),
    parentalEducation: getOptions(rows, 'parentalEducation'),
    lunch: getOptions(rows, 'lunch'),
    testPreparationCourse: getOptions(rows, 'testPreparationCourse'),
  }
}

function toNumber(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

function buildFeatureProfile(rows: StudentRecord[]) {
  const threshold = getThreshold(rows)

  const numericExtremes = Object.fromEntries(
    NUMERIC_COLUMNS.map((column) => {
      const values = rows.map((row) => Number(row[column]))
      return [column, {
        min: Math.min(...values),
        max: Math.max(...values),
      }]
    }),
  ) as Record<typeof NUMERIC_COLUMNS[number], { min: number; max: number }>

  const categoricalMaps = Object.fromEntries(
    CATEGORICAL_COLUMNS.map((column) => [
      column,
      Array.from(new Set(rows.map((row) => row[column]))),
    ]),
  ) as Record<typeof CATEGORICAL_COLUMNS[number], string[]>

  const featureColumns = [...CATEGORICAL_COLUMNS, ...NUMERIC_COLUMNS]

  const vectorize = (student: Partial<StudentRecord>) => {
    return featureColumns.map((column) => {
      if (NUMERIC_COLUMNS.includes(column as (typeof NUMERIC_COLUMNS)[number])) {
        const { min, max } = numericExtremes[column as (typeof NUMERIC_COLUMNS)[number]]
        const numericValue = toNumber(student[column as keyof StudentRecord] ?? 0)
        const normalized = max === min ? 0.5 : (numericValue - min) / (max - min)
        return clamp(normalized)
      }

      const values = categoricalMaps[column as (typeof CATEGORICAL_COLUMNS)[number]]
      const currentValue = String(student[column as keyof StudentRecord] ?? values[0] ?? '')
      const index = Math.max(0, values.indexOf(currentValue))
      return values.length > 1 ? index / (values.length - 1) : 0.5
    })
  }

  return {
    threshold,
    featureColumns,
    categoricalMaps,
    numericExtremes,
    vectorize,
  }
}

function predictPassProbability(row: Partial<StudentRecord>, rows: StudentRecord[], model: ModelName): number {
  const profile = buildFeatureProfile(rows)
  const vector = profile.vectorize(row)
  const numericScore = (toNumber(row.mathScore ?? 0) + toNumber(row.readingScore ?? 0) + toNumber(row.writingScore ?? 0)) / 3
  const prepBoost = row.testPreparationCourse === 'completed' ? 0.08 : 0
  const lunchBoost = row.lunch === 'standard' ? 0.03 : 0
  const femaleBoost = row.gender === 'female' ? 0.01 : 0

  if (model === 'knn') {
    const samples = rows.map((sample) => ({
      sample,
      vector: profile.vectorize(sample),
      actual: getScore(sample) >= profile.threshold,
    }))

    const distances = samples
      .map((sample) => ({
        sample,
        distance: sample.vector.reduce((total, value, index) => total + (value - vector[index]) ** 2, 0),
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, Math.min(5, samples.length))

    const passVotes = distances.filter(({ sample }) => sample.actual).length
    return distances.length ? passVotes / distances.length : 0.5
  }

  if (model === 'svm') {
    const positive = rows.filter((rowItem) => getScore(rowItem) >= profile.threshold).map((rowItem) => profile.vectorize(rowItem))
    const negative = rows.filter((rowItem) => getScore(rowItem) < profile.threshold).map((rowItem) => profile.vectorize(rowItem))

    const average = (vectors: number[][]) => vectors.length
      ? vectors[0].map((_, index) => vectors.reduce((total, item) => total + item[index], 0) / vectors.length)
      : vector

    const positiveCenter = average(positive)
    const negativeCenter = average(negative)
    const positiveDistance = positiveCenter.reduce((total, value, index) => total + (value - vector[index]) ** 2, 0)
    const negativeDistance = negativeCenter.reduce((total, value, index) => total + (value - vector[index]) ** 2, 0)

    return clamp(1 - positiveDistance / (positiveDistance + negativeDistance + 0.0001))
  }

  const normalizedMath = clamp(toNumber(row.mathScore ?? 0) / 100)
  const normalizedReading = clamp(toNumber(row.readingScore ?? 0) / 100)
  const normalizedWriting = clamp(toNumber(row.writingScore ?? 0) / 100)
  const balancedScore = (normalizedMath * 0.34) + (normalizedReading * 0.33) + (normalizedWriting * 0.33)
  const categoryScore = prepBoost + lunchBoost + femaleBoost
  const rawScore = (balancedScore * 0.8) + (vector.reduce((total, value) => total + value, 0) / vector.length) * 0.12 + categoryScore
  const adjusted = Math.tanh((rawScore * 2.4) - 1.15)

  return clamp((adjusted + 1) / 2)
}

function evaluateClassifier(rows: StudentRecord[], model: ModelName) {
  const profile = buildFeatureProfile(rows)
  const threshold = profile.threshold

  const actual = rows.map((row) => getScore(row) >= threshold)
  const predicted = rows.map((row) => predictPassProbability(row, rows, model) >= 0.5)

  const matrix: ConfusionMatrix = {
    truePositive: 0,
    falsePositive: 0,
    trueNegative: 0,
    falseNegative: 0,
  }

  actual.forEach((isPass, index) => {
    const guess = predicted[index]

    if (isPass && guess) {
      matrix.truePositive += 1
      return
    }

    if (!isPass && guess) {
      matrix.falsePositive += 1
      return
    }

    if (!isPass && !guess) {
      matrix.trueNegative += 1
      return
    }

    matrix.falseNegative += 1
  })

  const total = rows.length || 1
  const accuracy = (matrix.truePositive + matrix.trueNegative) / total
  const precision = matrix.truePositive / Math.max(1, matrix.truePositive + matrix.falsePositive)
  const recall = matrix.truePositive / Math.max(1, matrix.truePositive + matrix.falseNegative)
  const f1Score = (2 * precision * recall) / Math.max(0.0001, precision + recall)

  return {
    threshold,
    matrix,
    accuracy,
    precision,
    recall,
    f1Score,
  }
}

export function trainModel(rows: StudentRecord[], model: ModelName): ModelMetrics {
  const evaluation = evaluateClassifier(rows, model)
  const meta = MODEL_META[model]

  return {
    model,
    label: meta.label,
    description: meta.description,
    accuracy: evaluation.accuracy,
    precision: evaluation.precision,
    recall: evaluation.recall,
    f1Score: evaluation.f1Score,
    confusionMatrix: evaluation.matrix,
    threshold: evaluation.threshold,
    sampleCount: rows.length,
  }
}

export function predictStudent(rows: StudentRecord[], input: PredictionInput, model: ModelName): {
  label: PredictionLabel
  probability: number
  rationale: string
} {
  const probability = predictPassProbability({
    gender: input.gender,
    raceEthnicity: input.raceEthnicity,
    parentalEducation: input.parentalEducation,
    lunch: input.lunch,
    testPreparationCourse: input.testPreparationCourse,
    mathScore: toNumber(input.mathScore),
    readingScore: toNumber(input.readingScore),
    writingScore: toNumber(input.writingScore),
    totalScore: 0,
  }, rows.length ? rows : demoStudents, model)

  const label: PredictionLabel = probability >= 0.5 ? 'PASS' : 'FAIL'
  const rationale = label === 'PASS'
    ? 'The score profile is above the learned pass boundary.'
    : 'The score profile is below the learned pass boundary.'

  return {
    label,
    probability,
    rationale,
  }
}
