import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import {
  DOMAIN_FIELDS,
  DOMAIN_LABELS,
  autoMapColumns,
  detectFieldType,
} from '../../utils/columnMapper'
import type { ColumnMapping, Domain, FieldType } from '../../types'

const DOMAINS: Domain[] = ['manufacturing', 'marketing', 'sales', 'finance']

export default function ColumnMapper() {
  const { mappingFileId, uploads, closeMapper, applyMappings } = useStore()
  const file = uploads.find((u) => u.id === mappingFileId)
  const [localMappings, setLocalMappings] = useState<ColumnMapping[]>([])
  const [domain, setDomain] = useState<Domain>('manufacturing')
  const navigate = useNavigate()
  const location = useLocation()

  // Initialise mappings when file opens — auto-detect field types from data
  useEffect(() => {
    if (!file?.mappings) return
    const enriched = file.mappings.map((m) => {
      if (m.fieldType) return m
      const colValues = file.rows.slice(0, 30).map((r) => r[m.sourceColumn])
      return { ...m, fieldType: detectFieldType(m.sourceColumn, colValues) as FieldType }
    })
    setLocalMappings(enriched)
  }, [mappingFileId])

  if (!mappingFileId || !file) return null

  // When domain changes, re-run auto-mapping but keep field types already detected
  function handleDomainChange(d: Domain) {
    setDomain(d)
    const remapped = autoMapColumns(file!.headers, d)
    setLocalMappings((prev) =>
      remapped.map((m) => {
        const existing = prev.find((p) => p.sourceColumn === m.sourceColumn)
        return { ...m, fieldType: existing?.fieldType ?? m.fieldType }
      })
    )
  }

  function updateTargetField(sourceColumn: string, targetField: string) {
    setLocalMappings((prev) =>
      prev.map((m) => (m.sourceColumn === sourceColumn ? { ...m, targetField } : m))
    )
  }

  function handleApply() {
    applyMappings(file!.id, localMappings)
    if (location.pathname !== '/builder') {
      navigate('/builder')
    }
  }

  const domainFields = DOMAIN_FIELDS[domain]
  const previewRows = file.rows.slice(0, 5)
  const highConf = localMappings.filter(
    (m) => m.confidence >= 70 && m.targetField !== 'ignore' && m.targetField !== 'custom'
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Column Mapping</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Auto-detected from <span className="font-medium">{file.name}</span> — review and adjust if needed
            </p>
          </div>
          <button onClick={closeMapper} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Domain selector */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide shrink-0">Domain</span>
          <div className="flex gap-1">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => handleDomainChange(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  domain === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {DOMAIN_LABELS[d]}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[11px] text-gray-400">
            Switching domain re-maps columns using {DOMAIN_LABELS[domain].toLowerCase()} field names
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-4 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs shrink-0">
          <span className="text-gray-600"><strong className="text-gray-900">{file.headers.length}</strong> columns detected</span>
          <span className="text-gray-600"><strong className="text-gray-900">{file.rows.length}</strong> rows</span>
          <span className="text-green-700"><strong>{highConf}</strong> high-confidence auto-mappings</span>
          <span className="text-blue-600">
            <strong>{localMappings.filter(m => m.targetField === 'custom').length}</strong> custom fields
          </span>
        </div>

        {/* Horizontal mapping table */}
        <div className="flex-1 overflow-auto">
          <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
            <thead>

              {/* Row 1 — source column names */}
              <tr className="sticky top-0 z-20">
                {localMappings.map((m) => (
                  <th
                    key={m.sourceColumn}
                    className="min-w-[180px] px-3 py-2.5 bg-gray-50 border-b border-r border-gray-200 text-left align-bottom"
                  >
                    <p className="text-xs font-semibold text-gray-800 truncate max-w-[160px]">{m.sourceColumn}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Source column</p>
                  </th>
                ))}
              </tr>

              {/* Row 2 — domain mapping + field type + confidence */}
              <tr className="sticky top-[52px] z-20">
                {localMappings.map((m) => {
                  const isCustom = m.targetField === 'custom'
                  const isIgnore = m.targetField === 'ignore'
                  const borderColor = isIgnore || isCustom
                    ? '#e5e7eb'
                    : m.confidence >= 70 ? '#bbf7d0'
                    : m.confidence > 0   ? '#fde68a'
                    : '#e5e7eb'

                  return (
                    <td
                      key={m.sourceColumn}
                      className="min-w-[180px] px-2 py-2 bg-white border-b-2 border-r border-gray-100 align-top"
                      style={{ borderBottomColor: borderColor }}
                    >
                      {/* Domain field select */}
                      <select
                        value={m.targetField}
                        onChange={(e) => updateTargetField(m.sourceColumn, e.target.value)}
                        className={`w-full text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isCustom   ? 'border-blue-200 text-blue-700 font-medium' :
                          isIgnore   ? 'border-gray-200 text-gray-400' :
                          m.confidence >= 70 ? 'border-green-200 text-gray-900' :
                          m.confidence > 0   ? 'border-amber-200 text-gray-900' :
                          'border-gray-200 text-gray-900'
                        }`}
                      >
                        <optgroup label={`${DOMAIN_LABELS[domain]} Fields`}>
                          {domainFields.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Other">
                          <option value="custom">✦ Custom Field</option>
                          <option value="ignore">— Ignore —</option>
                        </optgroup>
                      </select>

                      {/* Custom field label */}
                      {isCustom && (
                        <p className="text-[10px] text-blue-500 mt-0.5 px-0.5 truncate">
                          → "{m.sourceColumn}"
                        </p>
                      )}

                      {/* Confidence badge */}
                      <div className="flex items-center gap-1 mt-1.5 px-0.5">
                        {!isCustom && !isIgnore && m.confidence >= 70 ? (
                          <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle size={11} className={isCustom ? 'text-blue-400 shrink-0' : 'text-gray-300 shrink-0'} />
                        )}
                        {isCustom ? (
                          <span className="text-[10px] text-blue-500 font-medium">Custom</span>
                        ) : m.confidence > 0 ? (
                          <span className={`text-[10px] font-semibold ${m.confidence >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                            {m.confidence}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">No match</span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </thead>

            {/* Data preview rows */}
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {localMappings.map((m) => {
                    const val = row[m.sourceColumn]
                    return (
                      <td
                        key={m.sourceColumn}
                        className="px-3 py-2 border-b border-r border-gray-100 text-xs text-gray-600 max-w-[180px]"
                      >
                        <span className="block truncate">
                          {val !== undefined && val !== null && val !== ''
                            ? String(val)
                            : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}

              {file.rows.length > 5 && (
                <tr>
                  {localMappings.map((m) => (
                    <td key={m.sourceColumn} className="px-3 py-1.5 border-r border-gray-100 text-[10px] text-gray-400 italic">
                      {m === localMappings[0] ? `+${file.rows.length - 5} more rows…` : ''}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button onClick={closeMapper} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-gray-400">
              {localMappings.filter(m => m.targetField !== 'ignore').length} of {localMappings.length} columns will be imported
            </p>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply &amp; Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
