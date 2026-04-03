# BuLLMind Report Builder — Complete Guide
> Written for beginners. No prior experience required to understand this document.

---

## Table of Contents

1. [What Is BuLLMind Report Builder?](#1-what-is-bullmind-report-builder)
2. [Tech Stack — Every Tool Used & Why](#2-tech-stack)
3. [Project Structure — How Files Are Organized](#3-project-structure)
4. [How the App Works — Full Flow](#4-how-the-app-works)
5. [Step-by-Step: How to Use It](#5-step-by-step-how-to-use-it)
6. [Every Page Explained](#6-every-page-explained)
7. [Key Concepts You Must Understand](#7-key-concepts-you-must-understand)
8. [Benefits & Advantages](#8-benefits--advantages)
9. [Disadvantages & Current Limitations](#9-disadvantages--current-limitations)
10. [What You Should Know as the Builder](#10-what-you-should-know-as-the-builder)
11. [Glossary](#11-glossary)

---

## 1. What Is BuLLMind Report Builder?

BuLLMind Report Builder is a **web-based business intelligence tool** that lets companies upload their data files (CSV, Excel, JSON) and instantly turn that raw data into visual reports — charts, KPI cards, tables — without writing a single line of code.

**Real-world example:**
> A production manager has a CSV file with 2,000 rows of machine output data. Instead of spending hours in Excel making charts, they upload the file to BuLLMind, map the columns, drag a "Bar Chart" widget onto the canvas, and in 5 minutes have a professional report showing output by production line.

**Who is it for?**
- CEOs and management who need quick visual summaries
- Department heads in Production, Finance, Purchasing, Quality, Logistics, Sales
- Analysts who report regularly and want reusable templates

**What problem does it solve?**
- Traditional reporting = manual Excel work, slow, error-prone
- BuLLMind = upload → map → build → save, in minutes

---

## 2. Tech Stack

Every tool used in this project, what it does, and why it was chosen.

---

### 2.1 React 18 — The UI Framework

**What it is:** A JavaScript library for building user interfaces.

**How it works:** React breaks the entire page into small reusable pieces called **components**. For example, a KPI card is one component. The header is another. When data changes, React automatically updates only the parts of the screen that need to change — without reloading the page.

**Why used here:** React is the industry standard for building modern dashboards and single-page applications (SPAs). It handles complex, interactive UIs efficiently.

**Example in this project:**
```
<KPICard />        → shows one metric (e.g. "Total Items: 1,240")
<BarChartWidget /> → shows a bar chart
<Canvas />         → the drag-and-drop report canvas
```

---

### 2.2 TypeScript — Type Safety

**What it is:** A superset of JavaScript that adds **types** to variables and functions.

**How it works:** Instead of writing `let count = 0`, you write `let count: number = 0`. If you accidentally assign a string to it later, TypeScript shows an error BEFORE the app runs.

**Why used here:** This project has complex data — uploaded files, widget configs, column mappings. TypeScript catches bugs like "you passed a string where a number was expected" during development, not after deployment.

**Example in this project:**
```typescript
type WidgetType = 'kpi' | 'bar-chart' | 'pie-chart' | 'line-chart' | 'table' | 'text'
// This means a widget can ONLY be one of these 6 types — nothing else allowed
```

---

### 2.3 Vite — The Build Tool & Dev Server

**What it is:** A modern build tool that compiles and serves the app during development.

**How it works:** When you run `npm run dev`, Vite starts a local server at `localhost:5173`. Every time you save a file, Vite instantly updates the browser — this is called **Hot Module Replacement (HMR)**. No page reload needed.

**Why used here:** Vite is extremely fast compared to older tools like Webpack. A project that took 30 seconds to start with Webpack starts in under 1 second with Vite.

**Commands:**
```bash
npm run dev      # Start development server at localhost:5173
npm run build    # Create production build (optimized, compressed files)
npm run preview  # Preview the production build locally
```

---

### 2.4 Zustand — State Management

**What it is:** A library for managing **global state** — data that multiple components need to share.

**The problem it solves:** Imagine a user uploads a file. The DataIntegration page needs to know about it. The Builder page needs to know about it. The Dashboard needs to count it. Without state management, you'd have to "pass" this data down through every component — which gets messy fast.

**How it works:** Zustand creates a single **store** (like a global variable) that any component can read from or write to.

**In this project the store holds:**
- List of uploaded files (`uploads`)
- Which file is currently active (`activeFileId`)
- All widgets on the canvas (`canvasWidgets`)
- The report title (`reportTitle`)
- All archived reports (`archivedReports`)
- Current theme (light/dark/system)
- Toast notification messages
- Column mapping modal state

**Example:**
```typescript
// Any component anywhere in the app can do this:
const { uploads, addUpload } = useStore()
// 'uploads' always has the latest list of files
// 'addUpload' adds a new file and ALL components re-render with the new data
```

---

### 2.5 React Router v6 — Navigation

**What it is:** A library that handles navigation between pages WITHOUT reloading the browser.

**How it works:** The URL changes (e.g. from `/` to `/builder`) but the page doesn't reload. React Router swaps out which component is displayed based on the URL path.

**Routes in this project:**
| URL | Page |
|-----|------|
| `/` | Data Source (upload files) |
| `/builder` | Report Builder (drag-and-drop) |
| `/templates` | Template Library |
| `/dashboard` | Dashboard overview |
| `/analytics` | Analytics page |
| `/archive` | Saved reports |
| `/ai-insights` | AI Insights |

---

### 2.6 Tailwind CSS — Styling

**What it is:** A CSS framework where you style elements using small utility classes directly in HTML/JSX.

**Traditional CSS approach:**
```css
.button { background-color: blue; padding: 8px 16px; border-radius: 8px; }
```
```html
<button class="button">Click</button>
```

**Tailwind approach:**
```html
<button class="bg-blue-600 px-4 py-2 rounded-lg">Click</button>
```

**Why used here:** Tailwind keeps styles close to the component, no separate CSS files to manage, and the final CSS bundle only includes classes that are actually used (very small file size).

**In this project also uses:** CSS custom properties (variables) like `var(--bg-surface)` for theme switching (light/dark mode). Tailwind classes handle layout; CSS variables handle colors.

---

### 2.7 @dnd-kit — Drag and Drop

**What it is:** A library for building drag-and-drop interfaces.

**Three packages used:**
- `@dnd-kit/core` — The base drag-and-drop engine (`DndContext`, `DragOverlay`)
- `@dnd-kit/sortable` — Makes lists sortable (`SortableContext`, `useSortable`)
- `@dnd-kit/utilities` — Helper functions (`CSS.Transform.toString`)

**How it works in the Builder:**
1. Each widget on the canvas is wrapped in `useSortable` — makes it draggable
2. `DndContext` wraps the whole canvas and listens for drag events
3. When you drop a widget on another position, `arrayMove` reorders the array
4. Zustand's `reorderWidgets` saves the new order
5. React re-renders the canvas in the new order

**Two types of drag in this project:**
- **Palette → Canvas:** Drag a widget type from the left panel onto the canvas (creates a new widget)
- **Canvas → Canvas:** Grab the grip handle on an existing widget and drag it to reorder

---

### 2.8 Recharts — Data Visualization

**What it is:** A charting library built on top of SVG for React.

**Charts used in this project:**
| Widget | Recharts Component |
|--------|--------------------|
| Bar Chart | `BarChart`, `Bar`, `XAxis`, `YAxis` |
| Pie Chart | `PieChart`, `Pie`, `Cell` |
| Line Chart | `LineChart`, `Line` |
| KPI Card | No chart — just computed numbers |
| Data Table | No chart — custom HTML table |

**How it works:** Recharts takes an array of data objects and renders them as SVG graphics. It handles axes, labels, tooltips, and colors automatically.

---

### 2.9 PapaParse — CSV Parsing

**What it is:** A library for reading CSV files in the browser.

**How it works:** When a user uploads a `.csv` file, PapaParse reads the raw text and converts it into a JavaScript array of objects.

**Example:**
```
CSV file:                    → PapaParse output:
Part,Qty,Cost               → [
Bolt,100,0.5                →   { Part: 'Bolt', Qty: '100', Cost: '0.5' },
Nut,200,0.3                 →   { Part: 'Nut',  Qty: '200', Cost: '0.3' }
                            → ]
```

---

### 2.10 XLSX — Excel File Parsing

**What it is:** A library for reading `.xlsx` (Excel) files in the browser.

**How it works:** Excel files are binary ZIP archives internally. XLSX unpacks them and converts the sheet data into JavaScript arrays — same format as PapaParse output.

---

### 2.11 React Dropzone — File Upload UX

**What it is:** A library that turns a `<div>` into a drag-and-drop file upload zone.

**How it works:** Wraps your div with event listeners for `dragover`, `drop`, and `click`. When a file is dropped or selected, it passes the file to your callback function.

---

### 2.12 Lucide React — Icons

**What it is:** A library of 1,000+ clean SVG icons as React components.

**Usage:** Every icon in the app (search, bell, settings, upload, chart icons) comes from here.

```tsx
import { Bell, Search, Settings } from 'lucide-react'
<Bell size={15} />   // renders the bell icon at 15px
```

---

## 3. Project Structure

```
Reports/
├── public/                  # Static files (favicon, etc.)
├── src/
│   ├── main.tsx             # App entry point — mounts React into the HTML
│   ├── App.tsx              # Root component — sets up routing & theme
│   ├── index.css            # Global CSS — variables, fonts, animations
│   │
│   ├── store/
│   │   └── useStore.ts      # THE BRAIN — all global state lives here
│   │
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   │
│   ├── utils/
│   │   ├── columnMapper.ts  # Logic for mapping file columns to standard fields
│   │   ├── exportCsv.ts     # Logic for exporting table data as CSV
│   │   └── seedData.ts      # Demo data (kept but not loaded at startup)
│   │
│   ├── pages/               # One file per page/route
│   │   ├── DataIntegration.tsx  # Route: /  (upload data)
│   │   ├── Builder.tsx          # Route: /builder
│   │   ├── Templates.tsx        # Route: /templates
│   │   ├── Dashboard.tsx        # Route: /dashboard
│   │   ├── Analytics.tsx        # Route: /analytics
│   │   ├── Archive.tsx          # Route: /archive
│   │   ├── AIInsights.tsx       # Route: /ai-insights
│   │   └── Login.tsx            # Not active yet
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx        # Shell: sidebar + header + page content
│   │   │   ├── Header.tsx        # Top bar: nav, search, notifications, settings
│   │   │   └── Sidebar.tsx       # Left nav: departments, quick links
│   │   │
│   │   ├── builder/
│   │   │   ├── Canvas.tsx        # The drag-and-drop canvas
│   │   │   ├── ComponentPanel.tsx # Left panel: widget palette
│   │   │   ├── PropertiesPanel.tsx # Right panel: widget settings
│   │   │   └── widgets/
│   │   │       ├── KPICard.tsx
│   │   │       ├── BarChartWidget.tsx
│   │   │       ├── PieChartWidget.tsx
│   │   │       ├── LineChartWidget.tsx
│   │   │       └── TableWidget.tsx
│   │   │
│   │   ├── upload/
│   │   │   ├── FileDropZone.tsx  # Drag-and-drop file upload area
│   │   │   ├── ColumnMapper.tsx  # Modal: map file columns → standard fields
│   │   │   └── RecentUploads.tsx # List of uploaded files with status
│   │   │
│   │   ├── templates/
│   │   │   ├── TemplateCard.tsx    # One template card
│   │   │   └── TemplatePreview.tsx # Modal: preview template before loading
│   │   │
│   │   ├── datasources/           # UI for each data source type
│   │   │   ├── ApiCallSource.tsx
│   │   │   ├── ClaudeCoworkSource.tsx
│   │   │   ├── SpreadsheetLinkSource.tsx
│   │   │   ├── WebScrapingSource.tsx
│   │   │   └── NotebookLMSource.tsx
│   │   │
│   │   ├── sap/
│   │   │   └── SapIntegrationModal.tsx  # SAP ERP connection modal
│   │   │
│   │   └── ui/
│   │       └── Toast.tsx          # Notification popup (bottom of screen)
│
├── package.json             # Dependencies list
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

---

## 4. How the App Works — Full Flow

Here is the complete journey from opening the app to having a finished report.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BuLLMind Flow                                │
│                                                                     │
│  STEP 1         STEP 2          STEP 3         STEP 4      STEP 5  │
│                                                                     │
│  Upload     →  Map Columns  →  Build Report →  Save    →  Archive  │
│  File          (match your     (drag widgets   Report     & Reuse   │
│  (CSV/Excel    columns to      to canvas)      to PDF/            │
│   /JSON)       standard                        Archive)            │
│                fields)                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Under the hood — what happens when you upload a file:

```
User drops file
      ↓
react-dropzone detects the file
      ↓
FileDropZone reads the file type:
  • .csv  → PapaParse parses it
  • .xlsx → XLSX library parses it
  • .json → JSON.parse()
      ↓
Result: array of row objects + array of column headers
      ↓
Zustand addUpload() saves this to global state:
  { id, name, rows, headers, status: 'UPLOADED', ... }
      ↓
RecentUploads component sees the new file (re-renders automatically)
      ↓
User clicks "Map Columns" button
      ↓
ColumnMapper modal opens (reads mappingFileId from store)
      ↓
User maps their columns to standard fields
  (e.g. "Part_No" → "part_number", "Qty" → "quantity")
      ↓
applyMappings() runs:
  • Creates standardizedRows (new array with renamed keys)
  • Updates file status to 'READY TO REVIEW'
  • Sets this file as the active file
      ↓
Data table appears on the page
User clicks "Drag & Drop" → goes to /builder
      ↓
Canvas reads standardizedRows from the active file
User drags a Bar Chart widget onto the canvas
      ↓
BarChartWidget reads the standardizedRows data
  and renders a chart using Recharts
      ↓
User saves to Archive → stored in Zustand archivedReports array
```

---

## 5. Step-by-Step: How to Use It

### Step 1 — Open the App
Run `npm run dev` in the terminal. Open `http://localhost:5173` in your browser.

### Step 2 — Upload Your Data File
- Go to the **Data Source** page (home page `/`)
- You'll see 8 data source options. Click **File Upload** (first one)
- Drag your CSV or Excel file into the drop zone, or click to browse
- Supported formats: `.csv`, `.xlsx`, `.json`
- Your file appears in **Recent Uploads** below

### Step 3 — Map Your Columns
Your file's column names (e.g. "Part_No", "Unit_Price") need to be matched to the app's standard field names (e.g. "part_number", "unit_cost").

- Click **Map Columns** next to your uploaded file
- A modal opens showing all your file's columns on the left
- Use the dropdowns on the right to match each column to a standard field
- Columns you don't need → select "Ignore"
- Click **Apply Mappings**
- Status changes to ✓ **READY TO REVIEW**
- A data table appears showing your mapped data

### Step 4 — Build Your Report
- Click the **Drag & Drop** button (blue button below the data table)
- You land on the **Report Builder** page (`/builder`)
- **Left panel** = widget palette (KPI, Bar Chart, Pie Chart, Line Chart, Table, Text)
- Click any widget to add it to the canvas
- **Or** drag it from the left panel to the canvas
- To **reorder** widgets: hover a widget → grab the ⠿ grip icon at the top center → drag

### Step 5 — Customize a Widget
- Click any widget on the canvas to select it (blue border appears)
- **Right panel** = Properties Panel
- Change the title, data field, color, or column span
- Changes apply instantly

### Step 6 — Use a Template (Optional)
- Go to **Templates** page (`/templates`)
- Browse 30 pre-built templates across 8 categories
- Click **Preview** to see what the template looks like
- Click **Use Template** to load it into the Builder

### Step 7 — Save Your Report
- In the Builder, click **Save to Archive** (top right)
- Your report is saved to the **Archive** page
- Later, go to Archive → click **Restore to Builder** to continue editing

---

## 6. Every Page Explained

### 6.1 Data Source Page (`/`)
**Purpose:** Upload data and prepare it for reporting.

**Left column (2/3 width):**
- **Data Source Grid** — 8 buttons: File Upload, Spreadsheet Link, Web Scraping, Claude Cowork, API Call, Notebook LM, SAP S/4HANA, SAP Tables
- **File Drop Zone** — appears when "File Upload" is selected
- **Recent Uploads** — list of all uploaded files with status badges

**Right column (1/3 width):**
- **Quick Stats** — shows: Files Uploaded, Ready to Review count, Total Rows, Active File Columns

**Below:** When a file is mapped → **Data Preview Table** with pagination, column toggle, CSV export

---

### 6.2 Report Builder (`/builder`)
**Purpose:** Drag and drop widgets to build a visual report.

**Left panel — ComponentPanel:**
- 3 tabs: Components, Data Sources, History
- Components tab: 6 draggable widget types
- Data Sources tab: shows your uploaded files
- History tab: lists widgets currently on canvas

**Center — Canvas:**
- 3-column grid layout
- Widgets can span 1, 2, or 3 columns
- Empty state shown when no widgets added

**Right panel — PropertiesPanel:**
- Shows when a widget is selected
- Options: rename, change data field, change color, change column span, delete

**Top bar:**
- Editable report title (click the pencil icon)
- "Live Editing" badge
- "Save to Archive" button

---

### 6.3 Templates (`/templates`)
**Purpose:** Browse and load pre-built report layouts.

**30 templates across 8 categories:**
- **PRODUCTION (5):** Daily Summary, Efficiency Dashboard, Machine Performance, Shift Report, Production vs Target
- **FINANCE (5):** P&L Summary, COGS Report, Cash Flow, Budget vs Actual, Cost Variance
- **INVENTORY (5):** Health Monitor, Stock Aging, Turnover Rate, Reorder Alert, Warehouse Utilization
- **PURCHASING (5):** Spend Analysis, Vendor Performance, PO Status, Price Variance, Lead Time
- **QUALITY (5):** Control Dashboard, Defect Analysis, Inspection Summary, Rejection Rate, Supplier Quality
- **BOM (5):** Cost Breakdown, Multi-Level BOM, Engineering Changes, BOM Comparison, Cost Rollup

Filter by: Category, Favorites, or search by name.

---

### 6.4 Dashboard (`/dashboard`)
**Purpose:** High-level overview of your workspace.

Shows:
- Time-based greeting ("Good morning / afternoon / evening")
- Stats: total files, total rows, reports built, templates used
- Quick action cards to jump to key features

---

### 6.5 Analytics (`/analytics`)
**Purpose:** Aggregate view of all uploaded data with charts.

Shows charts across all uploaded and mapped files combined.

---

### 6.6 Archive (`/archive`)
**Purpose:** Library of saved reports.

- Cards show: report title, department badge, widget count, date, source (Builder or AI)
- Tags for quick identification
- Filter by: department, source (Builder/AI), or search
- Actions: **Restore to Builder** (re-opens the report) or **Delete**

---

### 6.7 AI Insights (`/ai-insights`)
**Purpose:** Placeholder for future AI-generated analysis.

Currently shows the UI structure for AI-powered insights that will be connected to Claude AI.

---

## 7. Key Concepts You Must Understand

### 7.1 What is a "Component"?
A component is a reusable piece of UI. Think of it like a LEGO brick. The KPI card is one brick. The chart is another. You compose your report by combining these bricks.

```
Report = [KPICard] + [BarChart] + [PieChart] + [DataTable]
```

### 7.2 What is "State"?
State is data that the app remembers and reacts to. When state changes, the UI updates automatically.

```
uploads (state) = []       → Page shows "No files uploaded"
uploads (state) = [file1]  → Page shows the file in Recent Uploads
```

### 7.3 What is "Props"?
Props (short for properties) are how you pass data from a parent component to a child component.

```tsx
<KPICard config={widget} data={rows} selected={true} />
//        ↑ passing 3 props to KPICard
```

### 7.4 What is Column Mapping?
Your CSV might have a column called "PartNo" but the app's standard field is "part_number". Column mapping creates a translation table:

```
"PartNo"      → "part_number"
"Unit_Price"  → "unit_cost"
"Qty"         → "quantity"
"Description" → "description"
```

After mapping, the app creates `standardizedRows` — the same data but with consistent key names. Every chart widget then uses these consistent names to read data.

### 7.5 What is a Widget Span?
The canvas is a 3-column grid. A widget's "span" controls how wide it is:
- Span 1 = takes 1/3 of the width (good for KPI cards)
- Span 2 = takes 2/3 of the width (good for charts)
- Span 3 = takes full width (good for tables)

### 7.6 What is the DndContext?
`DndContext` is like a "drag supervisor". It wraps the canvas and monitors all pointer events. It knows:
- Which item is being dragged (`active`)
- What it's being dragged over (`over`)
- When to trigger the drop (`onDragEnd`)

### 7.7 What are CSS Variables?
CSS variables (custom properties) are reusable values that change based on the theme:

```css
:root {
  --bg-surface: #ffffff;   /* Light mode */
  --text-primary: #1e293b;
}

[data-theme="dark"] {
  --bg-surface: #161b27;   /* Dark mode */
  --text-primary: #e2e8f0;
}
```

When you switch to dark mode, `data-theme="dark"` is set on the `<html>` element, and ALL components that use `var(--bg-surface)` instantly update.

---

## 8. Benefits & Advantages

### ✅ No Code Required for End Users
A production manager or finance analyst does not need to know how to code. They upload a file, click a few buttons, and have a report. This is the core value proposition.

### ✅ Works Entirely in the Browser
No server, no database, no backend required. Everything runs locally in the browser. This means:
- Zero setup for end users
- Works offline after first load
- No data sent to any server (privacy-friendly)
- Can be deployed as a static site (very cheap hosting)

### ✅ Instant Visual Feedback
React + Recharts renders charts instantly as you drag widgets. There's no "Generate Report" button with a loading spinner. Everything is live.

### ✅ Reusable Templates
The 30 built-in templates mean users don't start from scratch every time. A team can standardize on the "Production Efficiency Dashboard" template and everyone uses the same layout.

### ✅ Flexible Data Sources
The app is designed for 8 data source types (even if some are UI-only today):
- File Upload (working)
- Spreadsheet Link
- Web Scraping
- Claude AI collaboration
- API calls
- Notebook LM
- SAP S/4HANA
- SAP Tables Direct

### ✅ Column Mapping Handles Messy Real-World Data
Every company names their columns differently. "PartNo", "PART_NUMBER", "Item Code" — all mean the same thing. The column mapper solves this without requiring the user to clean their data first.

### ✅ Archive System
Reports are saved with their full widget configuration. Any saved report can be restored to the builder and edited — this is version control for non-technical users.

### ✅ Department-Based Organization
The sidebar organizes work by department (Production, Finance, Quality, etc.) matching how real companies are structured. This makes navigation intuitive for business users.

### ✅ Light/Dark/System Theme
Modern UI expectation. Works by watching the OS preference via `matchMedia`, so it automatically matches the user's computer settings.

### ✅ Data Never Leaves the Browser
Since all parsing (PapaParse, XLSX) happens in JavaScript in the browser, the user's data files are never sent to any server. Critical for companies with sensitive financial or production data.

---

## 9. Disadvantages & Current Limitations

### ❌ Data Is Not Persisted Between Sessions
This is the biggest limitation. Zustand state lives in memory. When you refresh the browser, ALL data is gone:
- Uploaded files lost
- Canvas widgets lost
- Report configurations lost

**Fix needed:** Connect to `localStorage`, IndexedDB, or a backend database.

### ❌ No Real User Authentication
The login page exists but is not active. Anyone who opens the URL has full access. There's no concept of "your reports" vs "someone else's reports".

**Fix needed:** Add proper auth (e.g. Supabase, Firebase, or a custom backend).

### ❌ No Real SAP Integration
The SAP S/4HANA and SAP Tables buttons open a modal with a form, but don't actually connect to any SAP system. This is UI-only.

**Fix needed:** Implement actual SAP API calls or RFC connections.

### ❌ No PDF/PNG Export
There's a CSV export for data tables, but no way to export the entire report as a PDF or image.

**Fix needed:** Libraries like `html2canvas` + `jsPDF` can capture the canvas as a PDF.

### ❌ No Sharing
The "Share" button copies the current URL to clipboard. But since data isn't on a server, sharing the URL with someone else just opens an empty app for them.

### ❌ Chart Data Binding Is Basic
Currently charts read from `standardizedRows` using field names. There's no formula support, no aggregation controls in the UI, no filtering by date range, no drill-down.

### ❌ No Multi-User Collaboration
One user at a time. No real-time collaboration like Google Sheets.

### ❌ Large Excel Files May Freeze the Browser
All file parsing happens on the main JavaScript thread. A very large Excel file (50,000+ rows) can temporarily freeze the UI.

**Fix needed:** Use a Web Worker to parse files in a background thread.

### ❌ No Undo/Redo
If you accidentally delete a widget, there's no way to undo. The History tab in the panel shows what's on canvas, but doesn't store past states.

---

## 10. What You Should Know as the Builder

### 10.1 The Most Important File: `useStore.ts`
`src/store/useStore.ts` is the heart of the application. Every piece of data that moves between pages lives here. When you want to understand how something works, start by finding it in the store.

### 10.2 Adding a New Data Field
If you want charts to recognize a new data field (e.g. "lead_time"):
1. Add it to `src/utils/columnMapper.ts` — the `STANDARD_FIELDS` array
2. Add its display label to `STANDARD_FIELD_LABELS`
3. It will now appear in the column mapper dropdown

### 10.3 Adding a New Template
Templates are defined in `src/pages/Templates.tsx` as the `TEMPLATES` array.
Each template needs:
- `id` — unique slug (e.g. `'prod-new-template'`)
- `name` — display name
- `category` — one of the 8 categories
- `description` — one-line description
- `widgets` — array of `WidgetConfig` objects

### 10.4 Adding a New Widget Type
1. Add the type to `WidgetType` in `src/types/index.ts`
2. Create the widget component in `src/components/builder/widgets/`
3. Add it to the `renderWidget` switch in `Canvas.tsx`
4. Add it to the `PALETTE` array in `ComponentPanel.tsx`

### 10.5 The Theme System
To make a new component respect dark mode:
- Use `var(--bg-surface)` instead of `#ffffff`
- Use `var(--text-primary)` instead of `#1e293b`
- Use `var(--border)` instead of hardcoded border colors

See `src/index.css` for the full list of CSS variables.

### 10.6 How to Run the Project
```bash
# Navigate to the project folder
cd C:\Users\Admin\Desktop\Reports

# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Open browser at:
http://localhost:5173
```

### 10.7 Deployment (When Ready)
```bash
npm run build
# Creates a 'dist' folder with optimized HTML/CSS/JS
# Upload the 'dist' folder to any static hosting:
# - Netlify (drag and drop the folder)
# - Vercel (connect GitHub repo)
# - GitHub Pages
# - AWS S3 + CloudFront
```

### 10.8 Priority Improvements to Build Next
In order of importance:

1. **Persist data** — Use `localStorage` or `zustand/middleware persist` so data survives page refresh
2. **PDF export** — Export the entire canvas as a PDF
3. **Authentication** — Add login so users have their own workspace
4. **More chart types** — Scatter plot, Area chart, Gauge/Donut
5. **Chart filters** — Let users filter chart data by date range or category
6. **Formula KPIs** — Let users write formulas like "Total Cost / Quantity = Unit Cost"
7. **Backend + database** — So reports are saved permanently and can be shared
8. **Web Worker file parsing** — For large files without freezing the UI

---

## 11. Glossary

| Term | Meaning |
|------|---------|
| **SPA** | Single-Page Application — the page never fully reloads, just updates |
| **Component** | A reusable piece of UI (like a LEGO brick) |
| **State** | Data the app remembers — when it changes, UI updates automatically |
| **Props** | Data passed from parent to child component |
| **Hook** | A special React function starting with "use" (useState, useEffect, useStore) |
| **Zustand Store** | The global memory of the app — all shared data lives here |
| **Route** | A URL path that maps to a specific page component |
| **HMR** | Hot Module Replacement — browser updates instantly when you save a file |
| **Bundle** | The compiled, compressed output files ready for production |
| **CSV** | Comma-Separated Values — a simple text format for tabular data |
| **Column Mapping** | Translating your file's column names to the app's standard names |
| **Widget** | A visual block on the report canvas (KPI card, chart, table) |
| **Canvas** | The drag-and-drop area where you build your report |
| **KPI** | Key Performance Indicator — a single important number shown prominently |
| **DnD** | Drag and Drop — moving elements by holding and dragging them |
| **Template** | A pre-built report layout that can be loaded and customized |
| **Archive** | The library of saved, finished reports |
| **Standardized Rows** | Your data after column mapping — consistent key names |
| **CSS Variable** | A reusable value in CSS that changes based on theme |
| **TypeScript** | JavaScript with type checking — catches bugs before they happen |
| **Vite** | The tool that compiles and serves the app during development |
| **Tailwind** | A CSS framework using utility classes for styling |

---

*Document last updated: March 2026 | BuLLMind Report Builder v1.0.0*
