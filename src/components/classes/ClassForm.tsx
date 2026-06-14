'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import { getBrowserClient } from '@/lib/supabase/client'
import { StudentClass, ClassType } from '@/lib/types'
import { createClass, updateClass } from '@/lib/api/classes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const CLASS_TYPES: { value: ClassType; label: string }[] = [
  { value: 'fundamentals', label: 'Fundamentals' },
  { value: 'med_surg', label: 'Med-Surg' },
  { value: 'pharm', label: 'Pharmacology' },
  { value: 'peds', label: 'Pediatrics' },
  { value: 'ob', label: 'OB/GYN' },
  { value: 'psych', label: 'Psychiatric' },
  { value: 'pathophysiology', label: 'Pathophysiology' },
  { value: 'community_health', label: 'Community & Public Health' },
  { value: 'other', label: 'Other' },
]

interface ClassFormProps {
  classItem?: StudentClass | null
  onSuccess: () => void
  onCancel: () => void
}

function analyticsContext(action: 'create' | 'update', formData: { code: string; name: string; type: ClassType }) {
  return {
    action,
    class_type: formData.type,
    has_code: Boolean(formData.code.trim()),
    has_name: Boolean(formData.name.trim()),
    viewport_width: typeof window !== 'undefined' ? window.innerWidth : null,
    viewport_height: typeof window !== 'undefined' ? window.innerHeight : null,
    is_mobile_viewport: typeof window !== 'undefined' ? window.innerWidth < 768 : null,
    path: typeof window !== 'undefined' ? window.location.pathname : null,
  }
}

export default function ClassForm({ classItem, onSuccess, onCancel }: ClassFormProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'other' as ClassType,
    startDate: '',
    endDate: '',
    nextExamDate: '',
    notes: '',
  })

  useEffect(() => {
  const supabase = getBrowserClient()

    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (user) {
        setUserId(user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (classItem) {
      setFormData({
        code: classItem.code,
        name: classItem.name,
        type: classItem.type,
        startDate: classItem.startDate || '',
        endDate: classItem.endDate || '',
        nextExamDate: classItem.nextExamDate || '',
        notes: classItem.notes || '',
      })
    }
  }, [classItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const action = classItem ? 'update' : 'create'
    posthog.capture('class_add_attempted', analyticsContext(action, formData))

    if (!userId) {
      const message = 'We could not confirm your session. Please refresh and try again.'
      setErrorMessage(message)
      posthog.capture('class_add_failed', {
        ...analyticsContext(action, formData),
        reason: 'missing_user_session',
        error_message: message,
      })
      return
    }

    setLoading(true)
    try {
      if (classItem) {
        await updateClass(userId, classItem.id, formData)
      } else {
        await createClass(userId, formData)
      }

      posthog.capture('class_add_succeeded', analyticsContext(action, formData))
      onSuccess()
    } catch (error: any) {
      const message = error?.message || 'We could not save this class. Please try again.'
      console.error('Error saving class:', error)
      setErrorMessage(message)
      posthog.capture('class_add_failed', {
        ...analyticsContext(action, formData),
        reason: 'api_error',
        error_message: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Class Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="NUR 221"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Class Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Med-Surg I"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Class Type *</Label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ClassType })}
          className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:h-9 md:text-sm"
          required
        >
          {CLASS_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextExamDate">Next Exam</Label>
          <Input
            id="nextExamDate"
            type="date"
            value={formData.nextExamDate}
            onChange={(e) => setFormData({ ...formData, nextExamDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this class..."
          rows={3}
        />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 justify-end pt-4 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !userId}>
          {loading ? 'Saving...' : classItem ? 'Update Class' : 'Add Class'}
        </Button>
      </div>
    </form>
  )
}
