import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { Row } from '../types'

export interface ParseResult {
  headers: string[]
  rows: Row[]
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return parseCsv(file)
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file)
  } else if (ext === 'json') {
    return parseJson(file)
  }
  throw new Error(`Unsupported file type: .${ext}`)
}

function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? []
        resolve({ headers, rows: result.data as Row[] })
      },
      error: reject,
    })
  })
}

async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' })
  const headers = data.length > 0 ? Object.keys(data[0]) : []
  return { headers, rows: data }
}

async function parseJson(file: File): Promise<ParseResult> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const arr: Row[] = Array.isArray(parsed) ? parsed : [parsed]
  const headers = arr.length > 0 ? Object.keys(arr[0]) : []
  return { headers, rows: arr }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
