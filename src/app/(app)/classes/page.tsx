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
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Enhanced with consistent design */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                  <GraduationCap className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                  My Classes & Materials
                </h1>
              </div>
              <p className="text-base text-slate-600 ml-14 max-w-2xl leading-relaxed">
                Organize your classes and study materials in one place. Upload materials, then study with your AI tutor.
              </p>
            </div>
            {!showForm && (
              <Button 
                onClick={handleAddClass} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            )}
          </div>
        </div>

        {/* Form or List */}
        {showForm ? (
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mb-4">
              <GraduationCap className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
            <p className="text-lg font-medium text-slate-600">Loading your classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mb-6">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No classes yet</h3>
            <p className="text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              Add your first class to get started. You'll be able to upload materials and study with your AI tutor.
            </p>
            <Button 
              onClick={handleAddClass} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Class
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
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

