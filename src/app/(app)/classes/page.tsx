'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import ClassWithMaterials from '@/components/classes/ClassWithMaterials'
import ClassForm from '@/components/classes/ClassForm'
import { StudentClass } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, GraduationCap } from 'lucide-react'
import { listClasses } from '@/lib/api/classes'

export default function ClassesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState<StudentClass | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
  const supabase = getBrowserClient()

    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (user) {
        setUserId(user.id)
        loadClasses(user.id)
      } else {
        setLoading(false)
      }
    })
  }, [refreshKey])

  // Backfill course types on first load (runs once, updates 'other' → inferred type)
  useEffect(() => {
    fetch('/api/classes/backfill-types', { method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.updated > 0) {
          console.log('[Classes] Backfilled', data.updated, 'course types:', data.updates)
          setRefreshKey(k => k + 1) // Reload to show updated types
        }
      })
      .catch(() => {}) // Silent fail
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadClasses = async (uid: string) => {
    setLoading(true)
    try {
      const classList = await listClasses(uid)
      setClasses(classList)
    } catch (error) {
      console.error('Failed to load classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClass = () => {
    setEditingClass(null)
    setShowForm(true)
  }

  const handleEditClass = (classItem: StudentClass) => {
    setEditingClass(classItem)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingClass(null)
    setRefreshKey((k) => k + 1)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingClass(null)
  }

  const handleRefresh = () => {
    if (userId) {
      loadClasses(userId)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--gray-50)] p-4 sm:p-6 md:p-8 pt-safe-t">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 bg-[var(--navy)] rounded-xl flex-shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-[var(--navy)]">
                  My Courses
                </h1>
              </div>
              <p className="text-sm sm:text-base text-[var(--gray-400)] ml-11 sm:ml-14 max-w-2xl leading-relaxed">
                Organize your classes and study materials in one place. Upload materials, then study with your AI tutor.
              </p>
            </div>
            {!showForm && (
              <Button
                onClick={handleAddClass}
                className="w-full sm:w-auto bg-[var(--teal)] hover:bg-[#0A7A85] text-white transition-colors duration-200 flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            )}
          </div>
        </div>

        {/* Form or List */}
        {showForm ? (
          <div className="bg-white border border-[var(--gray-200)] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-[var(--navy)] mb-6">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h2>
            <ClassForm
              classItem={editingClass}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--gray-100)] mb-4">
              <GraduationCap className="w-8 h-8 text-[var(--gray-400)] animate-pulse" />
            </div>
            <p className="text-lg font-medium text-[var(--gray-400)]">Loading your classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white border border-[var(--gray-200)] rounded-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--gray-100)] mb-4 sm:mb-6">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--gray-400)]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--navy)] mb-2 sm:mb-3">No classes yet</h3>
            <p className="text-sm sm:text-base text-[var(--gray-400)] mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-4">
              Add your first class to get started. You'll be able to upload materials and study with your AI tutor.
            </p>
            <Button
              onClick={handleAddClass}
              className="bg-[var(--teal)] hover:bg-[#0A7A85] text-white transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Class
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 auto-rows-fr">
            {classes.map((classItem) => (
              <ClassWithMaterials
                key={classItem.id}
                classItem={classItem}
                onEdit={handleEditClass}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
