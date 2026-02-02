'use client'

import { useState } from 'react'
import { MessageSquare, Send, CheckCircle2, Loader2 } from 'lucide-react'

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    whatYouLove: '',
    whatsFrustrating: '',
    featureRequest: '',
    email: '',
  })
  const [rating, setRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          rating,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setIsSubmitted(true)
      // Reset form
      setFormData({
        whatYouLove: '',
        whatsFrustrating: '',
        featureRequest: '',
        email: '',
      })
      setRating(null)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-16 pt-safe-t">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50 p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Thank You! 🎉
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Your feedback helps us build a better NCLEX prep experience. We read every submission and use your insights to improve ForgeNursing.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
            >
              Submit More Feedback
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 pt-safe-t">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
              Give Feedback
            </h1>
          </div>
          <p className="text-slate-600 ml-14 max-w-2xl leading-relaxed">
            Help us build the best NCLEX prep tool. Your feedback shapes the future of ForgeNursing.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50 p-6 md:p-8">
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              How would you rate ForgeNursing overall?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-110 ${
                    rating && star <= rating
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">1 = Needs work, 5 = Amazing!</p>
          </div>

          {/* What you love */}
          <div className="mb-6">
            <label htmlFor="whatYouLove" className="block text-sm font-semibold text-slate-700 mb-2">
              What do you love about ForgeNursing? ❤️
            </label>
            <textarea
              id="whatYouLove"
              value={formData.whatYouLove}
              onChange={(e) => setFormData({ ...formData, whatYouLove: e.target.value })}
              placeholder="Tell us what's working well for you..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 transition-all duration-200 resize-none"
            />
          </div>

          {/* What's frustrating */}
          <div className="mb-6">
            <label htmlFor="whatsFrustrating" className="block text-sm font-semibold text-slate-700 mb-2">
              What's frustrating or confusing? 🤔
            </label>
            <textarea
              id="whatsFrustrating"
              value={formData.whatsFrustrating}
              onChange={(e) => setFormData({ ...formData, whatsFrustrating: e.target.value })}
              placeholder="What could be better? What's not working?"
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 transition-all duration-200 resize-none"
            />
          </div>

          {/* Feature request */}
          <div className="mb-6">
            <label htmlFor="featureRequest" className="block text-sm font-semibold text-slate-700 mb-2">
              What feature would you add? 💡
            </label>
            <textarea
              id="featureRequest"
              value={formData.featureRequest}
              onChange={(e) => setFormData({ ...formData, featureRequest: e.target.value })}
              placeholder="If you could add one thing, what would it be?"
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 transition-all duration-200 resize-none"
            />
          </div>

          {/* Email (optional) */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email (optional) 📧
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 transition-all duration-200"
            />
            <p className="text-xs text-slate-500 mt-2">
              Leave your email if you'd like us to follow up with you
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            Your feedback is anonymous unless you provide your email
          </p>
        </form>
      </div>
    </div>
  )
}
