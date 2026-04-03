import type { ColumnMapping, Domain, FieldType } from '../types'

// ── Domain field definition ──────────────────────────────────────────────────

export interface DomainField {
  key: string
  label: string
  aliases: string[]
}

// ── Domain field sets (10–15 fields each) ────────────────────────────────────

const MANUFACTURING_FIELDS: DomainField[] = [
  { key: 'finished_good', label: 'Finished Good',       aliases: ['finished good', 'fg', 'fg#', 'fg_no', 'product'] },
  { key: 'level',         label: 'Level',               aliases: ['level', 'lvl', 'bom level', 'bom_level', 'indent'] },
  { key: 'assembly',      label: 'Assembly',            aliases: ['assembly', 'assy', 'sub-assembly', 'subassembly', 'parent'] },
  { key: 'part_number',   label: 'Part Number / CPN',   aliases: ['part', 'item', 'cpn', 'sku', 'part_number', 'part no', 'pn', 'item no', 'component'] },
  { key: 'description',   label: 'Description',         aliases: ['desc', 'description', 'name', 'title', 'component name', 'item desc'] },
  { key: 'quantity',      label: 'Quantity',            aliases: ['qty', 'quantity', 'count', 'units', 'amount', 'total qty', 'req qty'] },
  { key: 'unit_cost',     label: 'Unit Cost',           aliases: ['cost', 'price', 'unit cost', 'unit_cost', 'unit price', 'rate', 'each'] },
  { key: 'total_cost',    label: 'Total Cost',          aliases: ['total cost', 'total_cost', 'extended cost', 'ext cost', 'total value'] },
  { key: 'supplier',      label: 'Supplier',            aliases: ['supplier', 'vendor', 'mfr', 'make', 'source', 'mfg'] },
  { key: 'manufacturer',  label: 'Manufacturer',        aliases: ['manufacturer', 'mfr', 'make', 'brand', 'oem'] },
  { key: 'mpn',           label: 'MPN',                 aliases: ['mpn', 'mfr part', 'manufacturer part', 'mfg pn', 'mfr_pn'] },
  { key: 'status',        label: 'Status',              aliases: ['status', 'state', 'condition', 'active', 'flag'] },
  { key: 'category',      label: 'Category',            aliases: ['category', 'cat', 'type', 'class', 'classification', 'family'] },
  { key: 'lead_time',     label: 'Lead Time',           aliases: ['lead time', 'lead_time', 'lt', 'delivery', 'weeks'] },
]

const MARKETING_FIELDS: DomainField[] = [
  { key: 'campaign_name',     label: 'Campaign Name',     aliases: ['campaign', 'campaign name', 'ad name', 'creative', 'ad'] },
  { key: 'channel',           label: 'Channel',           aliases: ['channel', 'platform', 'medium', 'network', 'source'] },
  { key: 'spend',             label: 'Spend',             aliases: ['spend', 'cost', 'budget', 'expense', 'investment'] },
  { key: 'impressions',       label: 'Impressions',       aliases: ['impressions', 'impr', 'views', 'reach', 'exposure'] },
  { key: 'clicks',            label: 'Clicks',            aliases: ['clicks', 'click', 'link clicks'] },
  { key: 'conversions',       label: 'Conversions',       aliases: ['conversions', 'conversion', 'conv', 'leads', 'sales'] },
  { key: 'ctr',               label: 'CTR',               aliases: ['ctr', 'click through rate', 'click-through'] },
  { key: 'cpc',               label: 'CPC',               aliases: ['cpc', 'cost per click', 'cost_per_click'] },
  { key: 'cpm',               label: 'CPM',               aliases: ['cpm', 'cost per mille', 'cost per thousand'] },
  { key: 'audience',          label: 'Audience',          aliases: ['audience', 'segment', 'target audience', 'demographic'] },
  { key: 'region',            label: 'Region',            aliases: ['region', 'country', 'location', 'geo', 'market'] },
  { key: 'date',              label: 'Date',              aliases: ['date', 'period', 'week', 'month', 'start date', 'end date'] },
]

const SALES_FIELDS: DomainField[] = [
  { key: 'deal_name',    label: 'Deal / Opportunity',  aliases: ['deal', 'opportunity', 'deal name', 'opp name', 'opp'] },
  { key: 'customer',     label: 'Customer',            aliases: ['customer', 'client', 'account', 'company', 'buyer'] },
  { key: 'product',      label: 'Product / Service',   aliases: ['product', 'service', 'item', 'offering', 'sku'] },
  { key: 'revenue',      label: 'Revenue',             aliases: ['revenue', 'amount', 'value', 'arr', 'mrr', 'deal value', 'contract value'] },
  { key: 'quantity',     label: 'Quantity',            aliases: ['qty', 'quantity', 'units', 'volume', 'seats'] },
  { key: 'stage',        label: 'Stage',               aliases: ['stage', 'status', 'phase', 'pipeline stage'] },
  { key: 'close_date',   label: 'Close Date',          aliases: ['close date', 'close', 'expected close', 'due date', 'target date'] },
  { key: 'rep',          label: 'Sales Rep',           aliases: ['rep', 'owner', 'salesperson', 'ae', 'account exec', 'assigned to'] },
  { key: 'region',       label: 'Region',              aliases: ['region', 'territory', 'area', 'geo', 'zone'] },
  { key: 'probability',  label: 'Probability',         aliases: ['probability', 'prob', 'win rate', 'likelihood', '%'] },
  { key: 'lead_source',  label: 'Lead Source',         aliases: ['source', 'lead source', 'channel', 'origin', 'how found'] },
  { key: 'notes',        label: 'Notes',               aliases: ['notes', 'comment', 'description', 'memo', 'details'] },
]

const FINANCE_FIELDS: DomainField[] = [
  { key: 'account',     label: 'Account',          aliases: ['account', 'gl account', 'account number', 'acc', 'account code'] },
  { key: 'amount',      label: 'Amount',           aliases: ['amount', 'value', 'sum', 'total', 'balance', 'net'] },
  { key: 'date',        label: 'Date',             aliases: ['date', 'transaction date', 'posting date', 'period', 'entry date'] },
  { key: 'tx_type',     label: 'Transaction Type', aliases: ['type', 'transaction type', 'entry type', 'debit credit', 'dr/cr'] },
  { key: 'category',    label: 'Category',         aliases: ['category', 'cost center', 'expense type', 'classification', 'cost type'] },
  { key: 'description', label: 'Description',      aliases: ['description', 'memo', 'notes', 'details', 'narrative', 'particulars'] },
  { key: 'reference',   label: 'Reference',        aliases: ['reference', 'ref', 'invoice', 'invoice number', 'doc number', 'voucher'] },
  { key: 'currency',    label: 'Currency',         aliases: ['currency', 'ccy', 'curr', 'fx'] },
  { key: 'department',  label: 'Department',       aliases: ['department', 'dept', 'business unit', 'division', 'bu'] },
  { key: 'project',     label: 'Project',          aliases: ['project', 'project code', 'job', 'wbs', 'cost object'] },
  { key: 'budget',      label: 'Budget',           aliases: ['budget', 'budgeted', 'plan', 'planned'] },
  { key: 'variance',    label: 'Variance',         aliases: ['variance', 'diff', 'delta', 'over under', 'deviation'] },
]

export const DOMAIN_FIELDS: Record<Domain, DomainField[]> = {
  manufacturing: MANUFACTURING_FIELDS,
  marketing:     MARKETING_FIELDS,
  sales:         SALES_FIELDS,
  finance:       FINANCE_FIELDS,
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  manufacturing: 'Manufacturing',
  marketing:     'Marketing',
  sales:         'Sales',
  finance:       'Finance',
}

// ── Field types ───────────────────────────────────────────────────────────────

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  identifier: 'Identifier',
  text:       'Text',
  numeric:    'Numeric',
  date:       'Date',
  category:   'Category',
}

export const ALL_FIELD_TYPES: FieldType[] = ['identifier', 'text', 'numeric', 'date', 'category']

// ── Field type auto-detection ─────────────────────────────────────────────────

export function detectFieldType(columnName: string, sampleValues: unknown[]): FieldType {
  const name = columnName.toLowerCase().replace(/[^a-z0-9]/g, ' ')

  // Name-based quick checks
  if (/\b(id|code|num|no|sku|pn|ref|part|serial|barcode)\b/.test(name)) return 'identifier'
  if (/\b(date|time|day|month|year|period|timestamp)\b/.test(name)) return 'date'
  if (/\b(flag|status|type|class|category|segment|tier|level|stage|region|country)\b/.test(name)) return 'category'

  const nonEmpty = sampleValues
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .slice(0, 30)

  if (nonEmpty.length === 0) return 'text'

  // Date check — strict ISO or common formats
  const dateCount = nonEmpty.filter(v => {
    const s = String(v).trim()
    return /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s) ||
           /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(s) ||
           /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(s)
  }).length
  if (dateCount / nonEmpty.length > 0.7) return 'date'

  // Numeric check — strips common currency/percent symbols
  const numericCount = nonEmpty.filter(v => {
    const s = String(v).trim().replace(/[$,€£¥%\s]/g, '')
    return s !== '' && !isNaN(Number(s)) && s.length > 0
  }).length
  if (numericCount / nonEmpty.length > 0.8) return 'numeric'

  // Identifier check — mixed alphanumeric part-number style
  const idCount = nonEmpty.filter(v =>
    /^[A-Za-z]{0,5}[-_]?\d{3,}/.test(String(v)) || /^\d{5,}$/.test(String(v))
  ).length
  if (idCount / nonEmpty.length > 0.5) return 'identifier'

  // Category check — low cardinality (many repeated values)
  const unique = new Set(nonEmpty.map(v => String(v).toLowerCase().trim())).size
  if (unique <= 10 || (nonEmpty.length >= 8 && unique / nonEmpty.length < 0.3)) return 'category'

  return 'text'
}

// ── Column auto-mapping ───────────────────────────────────────────────────────

export function autoMapColumns(headers: string[], domain: Domain = 'manufacturing'): ColumnMapping[] {
  const fields = DOMAIN_FIELDS[domain]

  return headers.map((col) => {
    const lower = col.toLowerCase().trim()
    let bestKey = 'custom'
    let bestScore = 0

    for (const field of fields) {
      for (const alias of field.aliases) {
        let score = 0
        if (lower === alias) {
          score = 100
        } else if (lower.includes(alias) || alias.includes(lower)) {
          score = 70
        } else if (alias.split(' ').some((word) => word.length > 2 && lower.includes(word))) {
          score = 40
        }
        if (score > bestScore) {
          bestScore = score
          bestKey = field.key
        }
      }
    }

    return {
      sourceColumn: col,
      targetField: bestKey,    // domain field key, or 'custom' if nothing matched
      confidence: bestScore,
    }
  })
}

// ── Backward-compat exports used by existing code ────────────────────────────

// All manufacturing field keys + special values
export const ALL_STANDARD_FIELDS: string[] = [
  ...MANUFACTURING_FIELDS.map(f => f.key),
  'custom',
  'ignore',
]

export const STANDARD_FIELD_LABELS: Record<string, string> = {
  ...Object.fromEntries(MANUFACTURING_FIELDS.map(f => [f.key, f.label])),
  custom: '✦ Custom Field',
  ignore: '— Ignore —',
}
