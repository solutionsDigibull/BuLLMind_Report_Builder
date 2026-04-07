import { MessageSquare, Send, Star } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store/useStore'

const CATEGORIES = ['Feature Request', 'Bug Report', 'UI/UX Suggestion', 'Performance', 'Other']

export default function Feedback() {
  const { showToast } = useStore()
  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [rating, setRating]     = useState(0)
  const [hover, setHover]       = useState(0)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitted(true)
    showToast('Feedback submitted — thank you!', 'success')
    setSubject('')
    setMessage('')
    setRating(0)
    setCategory(CATEGORIES[0])
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
            <MessageSquare size={17} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">Share your thoughts, suggestions, or ideas to help us improve.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    background: category === c ? '#eff6ff' : '#f9fafb',
                    borderColor: category === c ? '#93c5fd' : '#e5e7eb',
                    color: category === c ? '#2563eb' : '#6b7280',
                    fontWeight: category === c ? 600 : 400,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Feature suggestion"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none transition-all"
              onFocus={e => { e.currentTarget.style.borderColor = '#fcd34d'; e.currentTarget.style.background = '#fff' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb' }}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows={5}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none transition-all resize-none"
              onFocus={e => { e.currentTarget.style.borderColor = '#fcd34d'; e.currentTarget.style.background = '#fff' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb' }}
              required
            />
          </div>

          {/* Star rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Overall experience (optional)</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                >
                  <Star
                    size={22}
                    fill={(hover || rating) >= n ? '#f59e0b' : 'none'}
                    stroke={(hover || rating) >= n ? '#f59e0b' : '#d1d5db'}
                    className="transition-all"
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {submitted && (
              <p className="text-xs font-medium text-green-600">Thank you for your feedback!</p>
            )}
            <button
              type="submit"
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
            >
              <Send size={13} />
              Send Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
