export type CsvRow = Record<string, string>

const HEADER_ALIASES: Record<string, string> = {
  gender: 'gender',
  'race/ethnicity': 'raceEthnicity',
  'parental level of education': 'parentalEducation',
  lunch: 'lunch',
  'test preparation course': 'testPreparationCourse',
  'math score': 'mathScore',
  'reading score': 'readingScore',
  'writing score': 'writingScore',
  'total score': 'totalScore',
}

export function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase()
  return HEADER_ALIASES[key] ?? key.replace(/[^a-z0-9]+([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

export function formatHeaderLabel(header: string): string {
  const alias = HEADER_ALIASES[header.trim().toLowerCase()]
  if (!alias) {
    return header
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (char) => char.toUpperCase())
  }

  const labels: Record<string, string> = {
    gender: 'Gender',
    raceEthnicity: 'Race / Ethnicity',
    parentalEducation: 'Parental Education',
    lunch: 'Lunch',
    testPreparationCourse: 'Test Preparation',
    mathScore: 'Math Score',
    readingScore: 'Reading Score',
    writingScore: 'Writing Score',
    totalScore: 'Total Score',
  }

  return labels[alias] ?? alias
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (character === ',' && !insideQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  values.push(current.trim())
  return values
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return []
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader)

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = cells[index] ?? ''
      return row
    }, {})
  })
}
