import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Database,
  FileBarChart,
  FileUp,
  Info,
  Loader2,
  Search,
  Table2,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { useStore } from '../../store/useStore'
import { autoMapColumns } from '../../utils/columnMapper'
import type { ColumnMapping, Row } from '../../types'

// ── Types ────────────────────────────────────────────────────────────────────

export type SapMode = 'reports' | 'tables'

type Step = 'browse' | 'importing' | 'done'

interface SapObject {
  id: string
  name: string
  description: string
  rows: number
  category: string
}

// ── Sample SAP objects ───────────────────────────────────────────────────────

const SAP_REPORTS: SapObject[] = [
  { id: 'MB52', name: 'MB52', description: 'Warehouse Stocks per Material', rows: 2480, category: 'Inventory' },
  { id: 'ME2M', name: 'ME2M', description: 'Purchase Orders by Material', rows: 1345, category: 'Purchasing' },
  { id: 'MM60', name: 'MM60', description: 'Inventory Turnovers', rows: 890, category: 'Inventory' },
  { id: 'ME2L', name: 'ME2L', description: 'Purchase Orders by Vendor', rows: 674, category: 'Purchasing' },
  { id: 'MB51', name: 'MB51', description: 'Material Document List', rows: 5200, category: 'Inventory' },
  { id: 'ME2N', name: 'ME2N', description: 'Purchase Orders by PO Number', rows: 432, category: 'Purchasing' },
  { id: 'CO24', name: 'CO24', description: 'Missing Parts Information System', rows: 218, category: 'Production' },
  { id: 'VL06O', name: 'VL06O', description: 'Outbound Deliveries Monitor', rows: 760, category: 'Logistics' },
  { id: 'ME9F', name: 'ME9F', description: 'Purchase Order Confirmations', rows: 390, category: 'Purchasing' },
  { id: 'MB5B', name: 'MB5B', description: 'Stocks for Posting Date', rows: 1120, category: 'Inventory' },
]

const SAP_TABLES: SapObject[] = [
  { id: 'MARA', name: 'MARA', description: 'General Material Data', rows: 8450, category: 'Material' },
  { id: 'MARC', name: 'MARC', description: 'Plant Data for Material', rows: 6320, category: 'Material' },
  { id: 'MARD', name: 'MARD', description: 'Storage Location Data for Material', rows: 4210, category: 'Inventory' },
  { id: 'EKKO', name: 'EKKO', description: 'Purchasing Document Header', rows: 2890, category: 'Purchasing' },
  { id: 'EKPO', name: 'EKPO', description: 'Purchasing Document Item', rows: 9340, category: 'Purchasing' },
  { id: 'AUFK', name: 'AUFK', description: 'Order Master Data', rows: 1560, category: 'Production' },
  { id: 'VBAK', name: 'VBAK', description: 'Sales Document Header', rows: 3400, category: 'Sales' },
  { id: 'LIPS', name: 'LIPS', description: 'Delivery Item Data', rows: 5100, category: 'Logistics' },
  { id: 'MSEG', name: 'MSEG', description: 'Document Segment: Material', rows: 12400, category: 'Inventory' },
  { id: 'LFA1', name: 'LFA1', description: 'Vendor Master (General)', rows: 780, category: 'Purchasing' },
]

// ── Data generators ──────────────────────────────────────────────────────────

const MATERIALS = ['FG-10092', 'FG-10093', 'RM-20145', 'RM-20146', 'ASSY-982', 'ASSY-441', 'SUB-103', 'PKG-501']
const VENDORS = ['V-1001 Acme Corp', 'V-1002 FastParts', 'V-1003 GlobalSupply', 'V-1004 PrecisionMfg', 'V-1005 TechSource']
const PLANTS = ['1000', '1100', '2000', '3000']
const STATUSES = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'DELAYED', 'PENDING']
const CATEGORIES = ['Mechanical', 'Electronic', 'Fasteners', 'Packaging', 'Raw Material']

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randNum(min: number, max: number) { return Math.floor(Math.random() * (max - min)) + min }
function randCost() { return (Math.random() * 450 + 10).toFixed(2) }
function padZero(n: number, len = 10) { return String(n).padStart(len, '0') }

function generateRows(objectId: string, count: number): Row[] {
  const rows: Row[] = []
  for (let i = 0; i < count; i++) {
    const mat = rand(MATERIALS)
    switch (objectId) {
      // Reports
      case 'MB52':
        rows.push({
          MATNR: mat, WERKS: rand(PLANTS), LGORT: `000${randNum(1, 4)}`,
          MAKTX: `${rand(CATEGORIES)} Component ${i + 1}`,
          LABST: randNum(0, 500), EINME: 'EA',
          VERPR: randCost(), WAERS: 'USD',
          BWKEY: rand(PLANTS), LGPBE: `RACK-${randNum(1, 20)}`,
        })
        break
      case 'ME2M':
      case 'ME2L':
      case 'ME2N':
      case 'ME9F':
        rows.push({
          EBELN: padZero(4500000000 + i), EBELP: padZero(randNum(10, 100), 5),
          MATNR: mat, MAKTX: `${rand(CATEGORIES)} Component`,
          LIFNR: rand(VENDORS), MENGE: randNum(10, 1000),
          NETWR: randCost(), WAERS: 'USD',
          EINDT: `2024-0${randNum(1, 9)}-${padZero(randNum(1, 28), 2)}`,
          LOEKZ: '', ELIKZ: rand(['', '', '', 'X']),
          WERKS: rand(PLANTS),
        })
        break
      case 'MM60':
        rows.push({
          MATNR: mat, WERKS: rand(PLANTS), MAKTX: `${rand(CATEGORIES)} Part`,
          VERPR: randCost(), STPRS: randCost(),
          LBKUM: randNum(0, 800), SALK3: randCost(),
          UMSDZ: randNum(1, 60), WAERS: 'USD',
        })
        break
      case 'CO24':
        rows.push({
          AUFNR: padZero(1000000 + i, 12), MATNR: mat,
          MAKTX: `Finished Good ${i + 1}`, BDMNG: randNum(10, 200),
          MDLKZ: rand(['', 'X']), WERKS: rand(PLANTS),
          DISPO: `MRP${randNum(1, 9)}`, STATUS: rand(STATUSES),
        })
        break
      case 'MB51':
      case 'MB5B':
        rows.push({
          MBLNR: padZero(5000000000 + i), ZEILE: padZero(randNum(1, 10), 4),
          MATNR: mat, MAKTX: `${rand(CATEGORIES)} Material`,
          WERKS: rand(PLANTS), LGORT: `000${randNum(1, 4)}`,
          MENGE: randNum(1, 500), MEINS: 'EA',
          BUDAT: `2024-0${randNum(1, 9)}-${padZero(randNum(1, 28), 2)}`,
          BWART: rand(['101', '102', '201', '261', '301']),
        })
        break
      case 'VL06O':
        rows.push({
          VBELN: padZero(800000000 + i), POSNR: padZero(10, 6),
          MATNR: mat, MAKTX: `Finished Good Part`,
          LFIMG: randNum(1, 100), MEINS: 'EA',
          KUNNR: `C-${padZero(randNum(1000, 9999), 6)}`,
          WADAT_IST: `2024-0${randNum(1, 9)}-${padZero(randNum(1, 28), 2)}`,
          STATUS: rand(STATUSES), ROUTE: `R${randNum(100, 999)}`,
        })
        break
      // Tables
      case 'MARA':
        rows.push({
          MATNR: mat, MTART: rand(['FERT', 'HALB', 'ROH', 'VERP']),
          MBRSH: rand(['M', 'A', 'P']), MATKL: rand(['01', '02', '03', '04']),
          MEINS: 'EA', MAKTX: `${rand(CATEGORIES)} Material ${i + 1}`,
          NTGEW: (Math.random() * 50).toFixed(3), GEWEI: 'KG',
          ERSDA: `2022-0${randNum(1, 9)}-01`, LAEDA: `2024-0${randNum(1, 9)}-15`,
          MSTAE: rand(['', '', 'Z1', 'Z2']),
        })
        break
      case 'MARC':
        rows.push({
          MATNR: mat, WERKS: rand(PLANTS), BESKZ: rand(['E', 'F', 'X']),
          DISMM: rand(['PD', 'VB', 'MK']), DISPO: `MRP${randNum(1, 9)}`,
          MINBE: randNum(0, 100), EISBE: randNum(0, 200),
          MTVFP: '02', PLIFZ: randNum(1, 30), WEBAZ: randNum(1, 14),
          STRGR: rand(['01', '02']), LGPRO: `000${randNum(1, 4)}`,
        })
        break
      case 'MARD':
        rows.push({
          MATNR: mat, WERKS: rand(PLANTS), LGORT: `000${randNum(1, 4)}`,
          LABST: randNum(0, 1000), EINME: 'EA',
          UMLME: randNum(0, 50), INSME: randNum(0, 20),
          EINLME: 0, RETME: 0,
        })
        break
      case 'EKKO':
        rows.push({
          EBELN: padZero(4500000000 + i), BUKRS: '1000',
          BSART: rand(['NB', 'ZNB', 'UB']), LIFNR: rand(VENDORS),
          EKORG: '1000', EKGRP: rand(['001', '002', '003']),
          BEDAT: `2024-0${randNum(1, 9)}-01`, WAERS: 'USD',
          ZTERM: rand(['N030', 'N060', '0001']),
          LOEKZ: '', AEDAT: `2024-0${randNum(1, 9)}-15`,
        })
        break
      case 'EKPO':
        rows.push({
          EBELN: padZero(4500000000 + i), EBELP: padZero(randNum(10, 100), 5),
          MATNR: mat, MAKTX: `${rand(CATEGORIES)} Component`,
          WERKS: rand(PLANTS), LGORT: `000${randNum(1, 4)}`,
          MENGE: randNum(1, 500), MEINS: 'EA',
          NETPR: randCost(), PEINH: 1, WAERS: 'USD',
          EINDT: `2024-0${randNum(1, 9)}-${padZero(randNum(1, 28), 2)}`,
          ELIKZ: rand(['', '', 'X']), LOEKZ: '',
        })
        break
      case 'AUFK':
        rows.push({
          AUFNR: padZero(1000000 + i, 12), AUART: rand(['PP01', 'PP02', 'PM01']),
          WERKS: rand(PLANTS), MATNR: mat,
          GAMNG: randNum(10, 500), GMEIN: 'EA',
          GSTRS: `2024-0${randNum(1, 9)}-01`,
          GLTRS: `2024-0${randNum(1, 9)}-28`,
          OBJNR: `OR${padZero(1000000 + i, 12)}`,
          LOEKZ: '', PWERK: rand(PLANTS),
          STATUS: rand(STATUSES),
        })
        break
      case 'VBAK':
        rows.push({
          VBELN: padZero(1000000 + i), AUART: rand(['OR', 'ZOR', 'RO']),
          KUNNR: `C-${padZero(randNum(1000, 9999), 6)}`,
          NETWR: randCost(), WAERS: 'USD',
          VKORG: '1000', VTWEG: rand(['10', '20']),
          SPART: rand(['01', '02']), VKBUR: rand(['V001', 'V002']),
          AUDAT: `2024-0${randNum(1, 9)}-${padZero(randNum(1, 28), 2)}`,
          CMGST: rand(['A', 'B', 'C']),
        })
        break
      case 'LIPS':
        rows.push({
          VBELN: padZero(800000000 + i), POSNR: padZero(10, 6),
          MATNR: mat, MAKTX: `Delivery Item ${i + 1}`,
          LFIMG: randNum(1, 200), MEINS: 'EA',
          WERKS: rand(PLANTS), LGORT: `000${randNum(1, 4)}`,
          WADAT: `2024-0${randNum(1, 9)}-${padZero(randNum(1, 28), 2)}`,
          CHARG: '', KDMAT: '', STATUS: rand(STATUSES),
        })
        break
      case 'MSEG':
        rows.push({
          MBLNR: padZero(5000000000 + i), ZEILE: padZero(1, 4),
          MATNR: mat, WERKS: rand(PLANTS), LGORT: `000${randNum(1, 4)}`,
          BWART: rand(['101', '102', '201', '261']),
          MENGE: randNum(1, 500), MEINS: 'EA',
          DMBTR: randCost(), WAERS: 'USD',
          BUDAT: `2024-0${randNum(1, 9)}-${padZero(randNum(1, 28), 2)}`,
          LIFNR: rand(VENDORS),
        })
        break
      case 'LFA1':
        rows.push({
          LIFNR: `V-${padZero(1000 + i, 6)}`, KTOKK: 'LIEF',
          NAME1: rand(VENDORS).replace(/^V-\d+ /, ''), LAND1: rand(['US', 'DE', 'CN', 'JP', 'IN']),
          ORT01: rand(['New York', 'Hamburg', 'Shanghai', 'Tokyo', 'Mumbai']),
          PSTLZ: padZero(randNum(10000, 99999), 5),
          SPRAS: 'EN', WAERS: 'USD',
          KTOKK2: '', SPERR: '',
          LOEVM: '', STATUS: 'ACTIVE',
        })
        break
      default:
        rows.push({ id: i + 1, value: randNum(1, 1000), status: rand(STATUSES) })
    }
  }
  return rows
}

// ── Column mapping helpers ───────────────────────────────────────────────────

const SAP_FIELD_MAP: Record<string, string> = {
  MATNR: 'part_number', MAKTX: 'description', LIFNR: 'supplier',
  NETWR: 'total_cost', NETPR: 'unit_cost', VERPR: 'unit_cost', STPRS: 'unit_cost',
  MENGE: 'quantity', LABST: 'quantity', LFIMG: 'quantity', GMEIN: 'description',
  WERKS: 'assembly', LGORT: 'assembly', MATNR2: 'part_number',
  EBELN: 'finished_good', AUFNR: 'finished_good', VBELN: 'finished_good',
  LOEKZ: 'status', STATUS: 'status', CMGST: 'status',
  PLIFZ: 'lead_time', WEBAZ: 'lead_time',
  MATKL: 'category', MTART: 'category', BWART: 'category',
}

// ── Types ────────────────────────────────────────────────────────────────────

type View = 'landing' | 'reports' | 'csv'

// ── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  mode: SapMode
  onClose: () => void
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function SapIntegrationModal({ onClose }: Props) {
  const { addUpload, updateUpload, openMapper, applyMappings } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  function handleOpenInBuilder() {
    onClose()
    if (location.pathname !== '/builder') {
      navigate('/builder')
    }
  }

  // ── View state ───────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('landing')

  // ── SAP Reports state ────────────────────────────────────────────────────
  const [mode, setMode] = useState<SapMode>('reports')
  const [step, setStep] = useState<Step>('browse')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importProgress, setImportProgress] = useState<Record<string, 'pending' | 'loading' | 'done'>>({})
  const [filterCat, setFilterCat] = useState('All')

  // ── CSV state ────────────────────────────────────────────────────────────
  const [csvDragOver, setCsvDragOver] = useState(false)
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [csvFileName, setCsvFileName] = useState('')
  const [csvError, setCsvError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Reports helpers ──────────────────────────────────────────────────────
  const objects = mode === 'reports' ? SAP_REPORTS : SAP_TABLES
  const categories = ['All', ...Array.from(new Set(objects.map((o) => o.category)))]
  const filtered = objects.filter((o) => {
    const matchSearch = !search || o.id.includes(search.toUpperCase()) || o.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || o.category === filterCat
    return matchSearch && matchCat
  })

  const handleModeSwitch = (m: SapMode) => {
    setMode(m); setSearch(''); setSelected(new Set()); setFilterCat('All')
  }

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  // ── SAP Reports import ───────────────────────────────────────────────────
  const handleImportReports = async () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    const prog: Record<string, 'pending' | 'loading' | 'done'> = {}
    ids.forEach((id) => { prog[id] = 'pending' })
    setImportProgress(prog)
    setStep('importing')

    const fileIds: string[] = []
    for (const id of ids) {
      setImportProgress((p) => ({ ...p, [id]: 'loading' }))
      await delay(600 + Math.random() * 800)

      const obj = objects.find((o) => o.id === id)!
      const rows = generateRows(id, Math.min(100, obj.rows))
      const headers = rows.length > 0 ? Object.keys(rows[0]) : []
      const mappings: ColumnMapping[] = headers.map((col) => ({
        sourceColumn: col,
        targetField: (SAP_FIELD_MAP[col] ?? 'ignore') as ColumnMapping['targetField'],
        confidence: SAP_FIELD_MAP[col] ? 85 : 0,
      }))
      const fileId = genId()
      fileIds.push(fileId)
      const filename = `SAP_${id}_${new Date().toISOString().slice(0, 10)}.csv`
      addUpload({ id: fileId, name: filename, size: rows.length * 120, status: 'PROCESSING', headers, rows, mappings, standardizedRows: [], uploadedAt: new Date() })
      applyMappings(fileId, mappings)
      setImportProgress((p) => ({ ...p, [id]: 'done' }))
    }
    await delay(300)
    setStep('done')
  }

  // ── CSV import ───────────────────────────────────────────────────────────
  const handleCsvFile = (file: File) => {
    if (!file) return
    setCsvFileName(file.name)
    setCsvStatus('parsing')
    setCsvError('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as Row[]
        if (rows.length === 0) { setCsvStatus('error'); setCsvError('No data rows found in this file.'); return }
        const headers = result.meta.fields ?? []
        const mappings = autoMapColumns(headers)
        const fileId = genId()
        addUpload({ id: fileId, name: file.name, size: file.size, status: 'PROCESSING', headers, rows, mappings, standardizedRows: [], uploadedAt: new Date() })
        updateUpload(fileId, { headers, rows, mappings })
        setCsvStatus('done')
        setTimeout(() => { openMapper(fileId); onClose() }, 600)
      },
      error: (err) => { setCsvStatus('error'); setCsvError(err.message) },
    })
  }

  const onCsvDrop = (e: React.DragEvent) => {
    e.preventDefault(); setCsvDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleCsvFile(file)
  }

  // ── Header meta per view ─────────────────────────────────────────────────
  const headerMeta: Record<View, { icon: React.ReactNode; title: string; subtitle: string }> = {
    landing:  { icon: <Database size={18} className="text-blue-600" />,      title: 'SAP Integration',         subtitle: 'Connect or import SAP output data into BuLLMind' },
    reports:  { icon: <FileBarChart size={18} className="text-blue-600" />,   title: 'SAP Live Connection',     subtitle: step === 'browse' ? 'SAP connection is managed by your administrator' : step === 'importing' ? `Importing ${selected.size} object${selected.size !== 1 ? 's' : ''}...` : 'Import complete — data is ready in the builder' },
    csv:      { icon: <FileUp size={18} className="text-green-600" />,        title: 'Upload SAP Output (CSV)', subtitle: 'Upload a CSV exported from SAP' },
  }
  const hm = headerMeta[view]

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[88vh]">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {view !== 'landing' && (
              <button
                onClick={() => { setView('landing'); setStep('browse'); setSelected(new Set()); setCsvStatus('idle') }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              view === 'csv' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {hm.icon}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{hm.title}</h2>
              <p className="text-xs text-gray-500">{hm.subtitle}</p>
            </div>
            <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Mode tabs — only on reports view during browse */}
          {view === 'reports' && step === 'browse' && (
            <div className="flex gap-1 mt-3">
              {(['reports', 'tables'] as const).map((m) => (
                <button key={m} onClick={() => handleModeSwitch(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mode === m ? (m === 'reports' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white') : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  {m === 'reports' ? <FileBarChart size={13} /> : <Table2 size={13} />}
                  {m === 'reports' ? 'S/4HANA Reports' : 'SAP Tables'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reports breadcrumb */}
        {view === 'reports' && (
          <div className="flex items-center gap-1 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-medium">
            {(['browse', 'importing', 'done'] as const).map((s, i) => {
              const labels = { browse: '1. Select Objects', importing: '2. Import', done: '3. Done' }
              const stepOrder: Step[] = ['browse', 'importing', 'done']
              const current = stepOrder.indexOf(step)
              const mine = stepOrder.indexOf(s)
              const isDone = current > mine
              const isActive = current === mine
              return (
                <span key={s} className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded ${isDone ? 'text-green-700 bg-green-50' : isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-400'}`}>
                    {isDone ? '✓ ' : ''}{labels[s]}
                  </span>
                  {i < 2 && <ChevronRight size={10} className="text-gray-300" />}
                </span>
              )
            })}
          </div>
        )}

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* ── Landing ─────────────────────────────────────────────────── */}
          {view === 'landing' && (
            <div className="p-6 space-y-4">

              {/* Info banner */}
              <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  You can connect directly to SAP S/4HANA or upload SAP export files. Both options feed data into the report builder automatically.
                </p>
              </div>

              {/* 2-option cards */}
              <div className="grid grid-cols-2 gap-4">

                {/* Card 1 — SAP Live Connection */}
                <button onClick={() => setView('reports')}
                  className="flex flex-col items-start gap-3 p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-left transition-all group">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <FileBarChart size={22} className="text-blue-500" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">SAP Live Connection</p>
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                      Browse and import SAP outputs (BOM, MARA, EKPO, etc.) directly into the builder.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors mt-1">
                    Connect &amp; Import
                  </span>
                </button>

                {/* Card 2 — Upload SAP Output CSV */}
                <button onClick={() => setView('csv')}
                  className="flex flex-col items-start gap-3 p-5 rounded-xl border border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 text-left transition-all group">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    <Upload size={22} className="text-green-500" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Upload SAP Output (CSV)</p>
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                      Upload a CSV exported from any SAP transaction and map it to your report fields.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors mt-1">
                    Upload CSV
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── SAP Reports — Browse ─────────────────────────────────────── */}
          {view === 'reports' && step === 'browse' && (
            <div className="flex flex-col">
              <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <Database size={13} className="shrink-0 text-blue-500" />
                Connected via backend · Select the objects you want to import
              </div>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10 mt-2">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${mode === 'reports' ? 'report' : 'table'} name or description...`}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                      className={`px-2 py-1 text-[10px] font-semibold rounded ${filterCat === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {filtered.map((obj) => {
                  const isSel = selected.has(obj.id)
                  return (
                    <label key={obj.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSel ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(obj.id)} className="accent-blue-600 w-4 h-4 shrink-0" />
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          {mode === 'reports' ? <FileBarChart size={14} className="text-blue-500" /> : <Database size={14} className="text-purple-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{obj.id}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CAT_COLORS[obj.category] ?? 'bg-gray-100 text-gray-600'}`}>{obj.category}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{obj.description}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{obj.rows.toLocaleString()} rows</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SAP Reports — Importing ──────────────────────────────────── */}
          {view === 'reports' && step === 'importing' && (
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600 mb-4">Fetching data from SAP backend...</p>
              {Array.from(selected).map((id) => {
                const obj = objects.find((o) => o.id === id)!
                const status = importProgress[id] ?? 'pending'
                return (
                  <div key={id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      {status === 'done' ? <CheckCircle2 size={16} className="text-green-500" />
                        : status === 'loading' ? <Loader2 size={16} className="text-blue-500 animate-spin" />
                        : <div className="w-3 h-3 rounded-full border-2 border-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800">{id} — {obj.description}</p>
                      <p className="text-[10px] text-gray-400">
                        {status === 'done' ? `Imported ${Math.min(100, obj.rows)} rows`
                          : status === 'loading' ? 'Fetching...' : 'Queued'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── SAP Reports — Done ───────────────────────────────────────── */}
          {view === 'reports' && step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-lg">Import successful!</p>
                <p className="text-sm text-gray-500 mt-1">{selected.size} SAP object{selected.size !== 1 ? 's' : ''} imported. Column mapping will open next.</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center text-xs">
                {Array.from(selected).map((id) => (
                  <span key={id} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 font-medium">✓ {id}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── CSV Import ───────────────────────────────────────────────── */}
          {view === 'csv' && (
            <div className="p-6 space-y-4">
              {/* How to export tip */}
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                <Info size={13} className="shrink-0 mt-0.5 text-amber-500" />
                <p><span className="font-semibold">How to export from SAP:</span> Run any transaction (e.g. MB52, ME2M), click <span className="font-mono bg-amber-100 px-1 rounded">List → Export → Spreadsheet</span>, save as CSV, then upload here.</p>
              </div>

              {/* Drop zone */}
              {csvStatus !== 'done' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true) }}
                  onDragLeave={() => setCsvDragOver(false)}
                  onDrop={onCsvDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-12 ${
                    csvDragOver ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleCsvFile(e.target.files[0]) }} />
                  {csvStatus === 'parsing' ? (
                    <>
                      <Loader2 size={28} className="text-green-500 animate-spin" />
                      <p className="text-sm font-medium text-gray-700">Parsing <span className="font-semibold">{csvFileName}</span>...</p>
                    </>
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                        <Upload size={22} className="text-green-600" />
                      </span>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-800">Drop your SAP-exported CSV here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse · CSV files only</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {csvStatus === 'error' && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <Info size={13} className="shrink-0 text-red-400" />
                  {csvError || 'Could not parse the file. Make sure it is a valid CSV export from SAP.'}
                </div>
              )}

              {/* Success */}
              {csvStatus === 'done' && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-green-500" />
                  </div>
                  <p className="font-semibold text-gray-800">File imported successfully!</p>
                  <p className="text-xs text-gray-500">Opening column mapper...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            {step === 'done' ? 'Close' : 'Cancel'}
          </button>
          <div className="flex gap-2">
            {view === 'reports' && step === 'browse' && (
              <>
                <span className="text-xs text-gray-500 self-center">
                  {selected.size > 0 ? `${selected.size} selected` : 'Select objects above'}
                </span>
                <button disabled={selected.size === 0} onClick={handleImportReports}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Import Selected →
                </button>
              </>
            )}
            {view === 'reports' && step === 'done' && (
              <button onClick={handleOpenInBuilder} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                Open in Builder →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Inventory: 'bg-blue-50 text-blue-700', Purchasing: 'bg-amber-50 text-amber-700',
  Production: 'bg-purple-50 text-purple-700', Logistics: 'bg-green-50 text-green-700',
  Material: 'bg-cyan-50 text-cyan-700', Sales: 'bg-pink-50 text-pink-700',
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

