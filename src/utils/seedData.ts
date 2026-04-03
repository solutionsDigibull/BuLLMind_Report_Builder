import type { ColumnMapping, UploadedFile, WidgetConfig } from '../types'

// ── Seed BOM file ─────────────────────────────────────────────────────────────
const BOM_ROWS = [
  { finished_good: 'FG-10092', level: '1', assembly: 'ASSY-982', part_number: '917-00452-01', description: 'Multi-layer Integrated Circuit Board', quantity: 2, unit_cost: 145.00, total_cost: 290.00, supplier: 'Samsung Semi', manufacturer: 'Samsung', mpn: 'K4BG1646F-BCK0', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10092', level: '2', assembly: 'SUB-441', part_number: '849-22109-04', description: 'Thermal Paste Compound High-Performance', quantity: 1, unit_cost: 8.50, total_cost: 8.50, supplier: 'Arctic Silver', manufacturer: 'Arctic', mpn: 'AS5-3.5G', status: 'ACTIVE', category: 'Mechanical' },
  { finished_good: 'FG-10092', level: '1', assembly: 'ASSY-982', part_number: '218-99381-09', description: 'Aluminum Heat Sink Extruded Fan Support', quantity: 1, unit_cost: 22.00, total_cost: 22.00, supplier: 'Foxconn Tech', manufacturer: 'Foxconn', mpn: 'HS-9921-AF', status: 'ACTIVE', category: 'Mechanical' },
  { finished_good: 'FG-10092', level: '2', assembly: 'ASSY-102', part_number: '334-11822-09', description: 'Screws M3 Phillips Zinc Plated Bulk', quantity: 24, unit_cost: 0.12, total_cost: 2.88, supplier: 'Global Fasteners', manufacturer: 'Global', mpn: 'KS-PH-10M-Z', status: 'ACTIVE', category: 'Fasteners' },
  { finished_good: 'FG-10092', level: '1', assembly: 'ASSY-983', part_number: 'P-55210', description: 'Power Supply Unit 650W Modular', quantity: 1, unit_cost: 145.00, total_cost: 145.00, supplier: 'Seasonic', manufacturer: 'Seasonic', mpn: 'SSR-650FM', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10093', level: '1', assembly: 'CTL-Board', part_number: 'E-99120', description: 'Control Board ARM Cortex-M7', quantity: 1, unit_cost: 89.20, total_cost: 89.20, supplier: 'STMicro', manufacturer: 'STMicro', mpn: 'STM32H743', status: 'DELAYED', category: 'Electronic' },
  { finished_good: 'FG-10093', level: '1', assembly: 'CASE-01', part_number: 'M-11024', description: 'Casing Shell ABS Injection Molded', quantity: 1, unit_cost: 42.50, total_cost: 42.50, supplier: 'Plastex Corp', manufacturer: 'Plastex', mpn: 'ABX-42-BLK', status: 'ACTIVE', category: 'Mechanical' },
  { finished_good: 'FG-10093', level: '2', assembly: 'FAN-MOD', part_number: 'F-30201', description: 'Axial Fan 80mm PWM 4-pin', quantity: 2, unit_cost: 14.90, total_cost: 29.80, supplier: 'Noctua GmbH', manufacturer: 'Noctua', mpn: 'NF-A8-PWM', status: 'ACTIVE', category: 'Mechanical' },
  { finished_good: 'FG-10094', level: '1', assembly: 'PCB-MAIN', part_number: 'P-10045', description: 'Main PCB 6-layer FR4', quantity: 1, unit_cost: 67.00, total_cost: 67.00, supplier: 'TTM Tech', manufacturer: 'TTM', mpn: 'TTM-6L-FR4', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10094', level: '2', assembly: 'PWR-REG', part_number: 'V-20011', description: 'Voltage Regulator 3.3V 5A', quantity: 3, unit_cost: 4.20, total_cost: 12.60, supplier: 'TI Semiconductors', manufacturer: 'Texas Instruments', mpn: 'LM2596S-3.3', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10094', level: '1', assembly: 'CABLE-ASM', part_number: 'C-44102', description: 'Cable Assembly Ribbon 40-pin 15cm', quantity: 2, unit_cost: 3.80, total_cost: 7.60, supplier: 'Molex LLC', manufacturer: 'Molex', mpn: '0151670407', status: 'PENDING', category: 'Mechanical' },
  { finished_good: 'FG-10095', level: '1', assembly: 'SENSOR-BRD', part_number: 'S-77401', description: 'MEMS Pressure Sensor ±2% accuracy', quantity: 4, unit_cost: 18.60, total_cost: 74.40, supplier: 'Bosch Sensortec', manufacturer: 'Bosch', mpn: 'BMP388', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10095', level: '2', assembly: 'OPTICS', part_number: 'L-55023', description: 'Lens Array Optical Grade Polycarbonate', quantity: 1, unit_cost: 56.00, total_cost: 56.00, supplier: 'Edmund Optics', manufacturer: 'Edmund', mpn: 'EO-88-001', status: 'DELAYED', category: 'Mechanical' },
  { finished_good: 'FG-10095', level: '1', assembly: 'HOUSING', part_number: 'H-19204', description: 'IP67 Housing Polycarbonate Clear', quantity: 1, unit_cost: 28.00, total_cost: 28.00, supplier: 'Hammond Mfg', manufacturer: 'Hammond', mpn: '1554B2F', status: 'ACTIVE', category: 'Mechanical' },
  { finished_good: 'FG-10096', level: '1', assembly: 'MOTOR-ASM', part_number: 'MT-30120', description: 'Brushless DC Motor 24V 150W', quantity: 1, unit_cost: 210.00, total_cost: 210.00, supplier: 'Maxon Motor', manufacturer: 'Maxon', mpn: 'EC-i40-24V', status: 'ACTIVE', category: 'Mechanical' },
  { finished_good: 'FG-10096', level: '2', assembly: 'ENCODER', part_number: 'E-88012', description: 'Rotary Encoder 1024 PPR Optical', quantity: 1, unit_cost: 45.00, total_cost: 45.00, supplier: 'Heidenhain', manufacturer: 'Heidenhain', mpn: 'ERN 1020', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10096', level: '1', assembly: 'DRIVER-BD', part_number: 'D-66301', description: 'Motor Driver IC 3A Peak Current', quantity: 2, unit_cost: 12.40, total_cost: 24.80, supplier: 'Allegro MicroSys', manufacturer: 'Allegro', mpn: 'A4988SETTR-T', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10097', level: '1', assembly: 'RF-MODULE', part_number: 'R-10091', description: 'RF Module 2.4GHz IEEE 802.15.4', quantity: 1, unit_cost: 9.80, total_cost: 9.80, supplier: 'Nordic Semicon.', manufacturer: 'Nordic', mpn: 'nRF24L01+', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10097', level: '2', assembly: 'ANTENNA', part_number: 'A-55021', description: 'PCB Antenna 2.4GHz FR4', quantity: 1, unit_cost: 1.20, total_cost: 1.20, supplier: 'Taoglas Ltd', manufacturer: 'Taoglas', mpn: 'FXP73.07.0100A', status: 'ACTIVE', category: 'Electronic' },
  { finished_good: 'FG-10097', level: '1', assembly: 'BATTERY', part_number: 'B-44201', description: 'Li-Ion Battery 3.7V 2000mAh', quantity: 1, unit_cost: 6.50, total_cost: 6.50, supplier: 'EVE Energy', manufacturer: 'EVE', mpn: 'ICR18650-22P', status: 'PENDING', category: 'Electronic' },
]

const BOM_HEADERS = Object.keys(BOM_ROWS[0])

const BOM_MAPPINGS: ColumnMapping[] = BOM_HEADERS.map((col) => ({
  sourceColumn: col,
  targetField: col as any,
  confidence: 100,
}))

// ── Seed Purchase Orders file ──────────────────────────────────────────────────
const PO_ROWS = [
  { part_number: 'P-55210', description: 'Power Supply Unit 650W', quantity: 50, unit_cost: 142.00, total_cost: 7100.00, supplier: 'Seasonic', status: 'ACTIVE', category: 'Electronic', lead_time: 14 },
  { part_number: 'E-99120', description: 'Control Board ARM Cortex-M7', quantity: 30, unit_cost: 87.50, total_cost: 2625.00, supplier: 'STMicro', status: 'DELAYED', category: 'Electronic', lead_time: 21 },
  { part_number: 'M-11024', description: 'Casing Shell ABS', quantity: 100, unit_cost: 41.00, total_cost: 4100.00, supplier: 'Plastex Corp', status: 'ACTIVE', category: 'Mechanical', lead_time: 7 },
  { part_number: 'F-30201', description: 'Axial Fan 80mm PWM', quantity: 200, unit_cost: 13.90, total_cost: 2780.00, supplier: 'Noctua GmbH', status: 'ACTIVE', category: 'Mechanical', lead_time: 10 },
  { part_number: 'S-77401', description: 'MEMS Pressure Sensor', quantity: 80, unit_cost: 18.00, total_cost: 1440.00, supplier: 'Bosch Sensortec', status: 'ACTIVE', category: 'Electronic', lead_time: 30 },
  { part_number: 'MT-30120', description: 'Brushless DC Motor 24V', quantity: 20, unit_cost: 205.00, total_cost: 4100.00, supplier: 'Maxon Motor', status: 'ACTIVE', category: 'Mechanical', lead_time: 45 },
  { part_number: 'V-20011', description: 'Voltage Regulator 3.3V', quantity: 500, unit_cost: 4.00, total_cost: 2000.00, supplier: 'TI Semiconductors', status: 'ACTIVE', category: 'Electronic', lead_time: 5 },
  { part_number: 'C-44102', description: 'Cable Assembly 40-pin', quantity: 150, unit_cost: 3.60, total_cost: 540.00, supplier: 'Molex LLC', status: 'PENDING', category: 'Mechanical', lead_time: 8 },
  { part_number: 'R-10091', description: 'RF Module 2.4GHz', quantity: 120, unit_cost: 9.20, total_cost: 1104.00, supplier: 'Nordic Semicon.', status: 'ACTIVE', category: 'Electronic', lead_time: 12 },
  { part_number: 'B-44201', description: 'Li-Ion Battery 3.7V 2000mAh', quantity: 200, unit_cost: 6.00, total_cost: 1200.00, supplier: 'EVE Energy', status: 'PENDING', category: 'Electronic', lead_time: 20 },
  { part_number: '917-00452-01', description: 'IC Board Multi-layer', quantity: 40, unit_cost: 140.00, total_cost: 5600.00, supplier: 'Samsung Semi', status: 'ACTIVE', category: 'Electronic', lead_time: 28 },
  { part_number: 'L-55023', description: 'Lens Array Polycarbonate', quantity: 25, unit_cost: 54.00, total_cost: 1350.00, supplier: 'Edmund Optics', status: 'DELAYED', category: 'Mechanical', lead_time: 35 },
]

// ── Seed Inventory file ────────────────────────────────────────────────────────
const INVENTORY_ROWS = [
  { part_number: 'P-55210', description: 'Power Supply 650W', quantity: 142, unit_cost: 145.00, total_cost: 20590.00, supplier: 'Seasonic', status: 'ACTIVE', category: 'Electronic', assembly: 'Warehouse A' },
  { part_number: 'E-99120', description: 'Control Board Cortex-M7', quantity: 38, unit_cost: 89.20, total_cost: 3389.60, supplier: 'STMicro', status: 'DELAYED', category: 'Electronic', assembly: 'Warehouse B' },
  { part_number: 'M-11024', description: 'ABS Casing Shell', quantity: 310, unit_cost: 42.50, total_cost: 13175.00, supplier: 'Plastex Corp', status: 'ACTIVE', category: 'Mechanical', assembly: 'Warehouse A' },
  { part_number: 'F-30201', description: 'PWM Fan 80mm', quantity: 475, unit_cost: 14.90, total_cost: 7077.50, supplier: 'Noctua GmbH', status: 'ACTIVE', category: 'Mechanical', assembly: 'Warehouse C' },
  { part_number: 'S-77401', description: 'MEMS Pressure Sensor', quantity: 92, unit_cost: 18.60, total_cost: 1711.20, supplier: 'Bosch Sensortec', status: 'ACTIVE', category: 'Electronic', assembly: 'Warehouse B' },
  { part_number: 'MT-30120', description: 'BLDC Motor 24V 150W', quantity: 18, unit_cost: 210.00, total_cost: 3780.00, supplier: 'Maxon Motor', status: 'ACTIVE', category: 'Mechanical', assembly: 'Warehouse A' },
  { part_number: 'V-20011', description: 'Vreg 3.3V 5A', quantity: 1240, unit_cost: 4.20, total_cost: 5208.00, supplier: 'TI Semiconductors', status: 'ACTIVE', category: 'Electronic', assembly: 'Warehouse C' },
  { part_number: 'R-10091', description: 'RF Module 2.4GHz', quantity: 203, unit_cost: 9.80, total_cost: 1989.40, supplier: 'Nordic Semicon.', status: 'ACTIVE', category: 'Electronic', assembly: 'Warehouse B' },
  { part_number: 'B-44201', description: 'Li-Ion Battery 2000mAh', quantity: 88, unit_cost: 6.50, total_cost: 572.00, supplier: 'EVE Energy', status: 'PENDING', category: 'Electronic', assembly: 'Warehouse C' },
  { part_number: '334-11822-09', description: 'M3 Phillips Screws Bulk', quantity: 8400, unit_cost: 0.12, total_cost: 1008.00, supplier: 'Global Fasteners', status: 'ACTIVE', category: 'Fasteners', assembly: 'Warehouse A' },
]

// ── Seed canvas widgets ───────────────────────────────────────────────────────
export const SEED_CANVAS_WIDGETS: WidgetConfig[] = [
  { id: 'seed-kpi-1', type: 'kpi', title: 'Total BOM Items', dataField: 'quantity', order: 0, span: 1, color: '#2563eb' },
  { id: 'seed-kpi-2', type: 'kpi', title: 'Total BOM Value', dataField: 'total_cost', order: 1, span: 1, color: '#2563eb' },
  { id: 'seed-kpi-3', type: 'kpi', title: 'At-Risk Components', dataField: 'status', order: 2, span: 1, color: '#dc2626' },
  { id: 'seed-bar', type: 'bar-chart', title: 'Quantity by Category', dataField: 'quantity', groupBy: 'category', order: 3, span: 2, color: '#2563eb' },
  { id: 'seed-pie', type: 'pie-chart', title: 'Cost Breakdown by Category', dataField: 'total_cost', groupBy: 'category', order: 4, span: 1, color: '#2563eb' },
  { id: 'seed-table', type: 'table', title: 'Bill of Materials Review', order: 5, span: 3, color: '#2563eb' },
]

// ── Seed uploaded files ───────────────────────────────────────────────────────
function makeFile(id: string, name: string, rows: Record<string, unknown>[]): UploadedFile {
  const headers = Object.keys(rows[0])
  const mappings: ColumnMapping[] = headers.map((col) => ({
    sourceColumn: col,
    targetField: col as any,
    confidence: 100,
  }))
  return {
    id,
    name,
    size: rows.length * 150,
    status: 'READY TO REVIEW',
    headers,
    rows: rows as any,
    mappings,
    standardizedRows: rows as any,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 30),
  }
}

export const SEED_FILES: UploadedFile[] = [
  makeFile('seed-bom', 'BOM_Q3_Sourcing_Draft.csv', BOM_ROWS as any),
  makeFile('seed-po', 'Purchase_Orders_Active.csv', PO_ROWS as any),
  makeFile('seed-inv', 'Inventory_Logistics_Master.xlsx', INVENTORY_ROWS as any),
]

export const SEED_ACTIVE_FILE_ID = 'seed-bom'
