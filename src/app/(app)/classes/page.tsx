'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
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
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadClasses(user.id)
      } else {
        setLoading(false)
      }
    })
  }, [refreshKey])

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
    <div className="min-h-full bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-indigo-600" />
                My Classes & Materials
              </h1>
              <p className="text-slate-600 mt-2">
                Organize your classes and study materials in one place. Upload materials, then study with your AI tutor.
              </p>
            </div>
            {!showForm && (
              <Button onClick={handleAddClass} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            )}
          </div>
        </div>

        {/* Form or List */}
        {showForm ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h2>
            <ClassForm
              classItem={editingClass}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-slate-600">
            Loading your classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No classes yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Add your first class to get started. You'll be able to upload materials and study with your AI tutor.
            </p>
            <Button onClick={handleAddClass} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Class
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

