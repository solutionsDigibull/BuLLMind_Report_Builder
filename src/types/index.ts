export type Department = 'Purchasing' | 'Production' | 'Quality' | 'Logistics' | 'Sales' | 'Finance'

export type AnalysisPurpose = 'Deep Analysis' | 'Summary' | 'Trend Analysis' | 'Audit'

export type UploadStatus = 'PROCESSING' | 'READY TO REVIEW' | 'ERROR'

export interface UploadedFile {
  id: string
  name: string
  size: number
  status: UploadStatus
  headers: string[]
  rows: Row[]
  mappings: ColumnMapping[]
  standardizedRows: Row[]
  uploadedAt: Date
}

export type Row = Record<string, unknown>

// Flexible string type — supports manufacturing fields, domain-specific fields, 'custom', and 'ignore'
export type StandardField = string

export type FieldType = 'identifier' | 'text' | 'numeric' | 'date' | 'category'

export type Domain = 'manufacturing' | 'marketing' | 'sales' | 'finance'

export interface ColumnMapping {
  sourceColumn: string
  targetField: StandardField  // domain field key | 'custom' | 'ignore'
  confidence: number          // 0–100
  fieldType?: FieldType       // auto-detected or user-set
}

export type WidgetType =
  | 'kpi'
  | 'bar-chart'
  | 'pie-chart'
  | 'line-chart'
  | 'table'
  | 'text'

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  dataField?: StandardField
  groupBy?: StandardField
  color?: string
  bgStyle?: 'default' | 'tint' | 'gradient' | 'bold'
  span?: 1 | 2 | 3
  row?: number
  order: number
}

export interface ArchivedReport {
  id: string
  title: string
  department: Department
  widgetCount: number
  widgets: WidgetConfig[]
  source: 'builder' | 'ai'
  tags: string[]
  createdAt: Date
}

export interface Template {
  id: string
  name: string
  description: string
  category: 'PRODUCTION' | 'ANALYTICS' | 'LOGISTICS' | 'FINANCE' | 'QUALITY' | 'INVENTORY' | 'PURCHASING' | 'BOM'
  tags: string[]
  widgets: WidgetConfig[]
  thumbnail?: string
}
