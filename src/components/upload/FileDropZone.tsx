import { Upload } from 'lucide-react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useStore } from '../../store/useStore'
import { autoMapColumns } from '../../utils/columnMapper'
import { apiJson, apiUpload } from '../../utils/api'
import type { Row } from '../../types'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

interface ServerUpload {
  id: string; name: string; size: number; status: string
  headers: string[]; uploadedAt: string
}

export default function FileDropZone() {
  const { addUpload, updateUpload, openMapper, showToast } = useStore()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const tempId = genId()
        addUpload({
          id: tempId,
          name: file.name,
          size: file.size,
          status: 'PROCESSING',
          headers: [],
          rows: [],
          mappings: [],
          standardizedRows: [],
          uploadedAt: new Date(),
        })

        try {
          const formData = new FormData()
          formData.append('file', file)
          const record = await apiUpload<ServerUpload>('/api/uploads', formData)
          const rows = await apiJson<Row[]>(`/api/uploads/${record.id}/rows`)
          const mappings = autoMapColumns(record.headers)
          // Replace the optimistic entry (including its id) with the server record
          updateUpload(tempId, {
            id: record.id,
            headers: record.headers,
            rows,
            mappings,
            standardizedRows: [],
            uploadedAt: new Date(record.uploadedAt),
            status: 'PROCESSING',
          })
          openMapper(record.id)
        } catch (err) {
          updateUpload(tempId, { status: 'ERROR' })
          showToast(`Failed to upload ${file.name}`, 'error')
        }
      }
    },
    [addUpload, updateUpload, openMapper, showToast]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true, // we control click via the Browse button
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
    },
    maxSize: 250 * 1024 * 1024,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Upload size={22} className="text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">
            {isDragActive ? 'Drop files here...' : 'Drop files here'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Upload .xlsx, .csv, or .json files. Maximum file size 250MB per analysis session.
          </p>
        </div>
        <button
          type="button"
          onClick={open}
          className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Browse Files
        </button>
      </div>
    </div>
  )
}
