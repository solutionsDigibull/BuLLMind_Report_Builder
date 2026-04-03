import { X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'

type Mode = 'support' | 'feedback'

interface Props {
  initialMode: Mode
  onClose: () => void
}

export default function SupportFeedbackModal({ initialMode, onClose }: Props) {
  const { showToast } = useStore()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'support') {
      showToast('Support request submitted — we\'ll get back to you shortly.', 'success')
    } else {
      showToast('Feedback submitted — thank you!', 'success')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('support')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                mode === 'support' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Support
            </button>
            <button
              onClick={() => setMode('feedback')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                mode === 'feedback' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {mode === 'support' ? (
            <p className="text-sm text-gray-500">
              Describe your issue and we'll help you resolve it.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Share your thoughts, suggestions, or ideas to help us improve.
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={mode === 'support' ? 'e.g. Report not loading' : 'e.g. Feature suggestion'}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={mode === 'support' ? 'Describe the issue in detail...' : 'Tell us what you think...'}
              required
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {mode === 'support' ? 'Submit Request' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
