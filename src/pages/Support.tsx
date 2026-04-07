import { HelpCircle, Mail, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store/useStore'

const FAQ = [
  { q: 'How do I upload a file?', a: 'Go to Data Sources, select File Upload, then drag & drop or browse for your CSV/Excel file.' },
  { q: 'How do I save a report?', a: 'In the Builder, click "Save to Archive" at the top right to save your current report.' },
  { q: 'Which file formats are supported?', a: 'CSV, Excel (.xlsx, .xls) and JSON files up to 50MB are supported.' },
  { q: 'How do I use AI Insights?', a: 'Go to AI Insights, make sure OpenWork is connected, then type your question in the chat.' },
]

export default function Support() {
  const { showToast } = useStore()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitted(true)
    showToast('Support request submitted — we\'ll get back to you shortly.', 'success')
    setSubject('')
    setMessage('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)' }}>
            <HelpCircle size={17} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">Describe your issue and we'll help you resolve it.</p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Form */}
        <div className="col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">Submit a request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Report not loading"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none transition-all"
                  onFocus={e => { e.currentTarget.style.borderColor = '#7eb3f7'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={6}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none transition-all resize-none"
                  onFocus={e => { e.currentTarget.style.borderColor = '#7eb3f7'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb' }}
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                {submitted && (
                  <p className="text-xs font-medium text-green-600">Request submitted successfully!</p>
                )}
                <button
                  type="submit"
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)', boxShadow: '0 4px 14px rgba(79,142,247,0.3)' }}
                >
                  <Send size={13} />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* FAQ */}
        <div className="col-span-2 space-y-4">
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle size={14} className="text-blue-500" />
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Quick Answers</p>
            </div>
            <div className="space-y-4">
              {FAQ.map((item, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-gray-800 mb-0.5">{item.q}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={14} className="text-gray-400" />
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Contact</p>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              You can also reach us at{' '}
              <span className="text-blue-500 font-medium">support@bullmind.io</span>
              {' '}for urgent issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
