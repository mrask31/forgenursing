import { StudentClass, ClassType } from '@/lib/types'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json()
    return data?.error || data?.message || fallback
  } catch {
    return fallback
  }
}

export async function listClasses(userId: string): Promise<StudentClass[]> {
  try {
    const response = await fetch(`/api/classes?userId=${userId}`, {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Failed to fetch classes'))
    }
    const data = await response.json()
    return data.classes || []
  } catch (error) {
    console.error('[Classes API] Error listing classes:', error)
    return []
  }
}

export async function createClass(
  userId: string,
  payload: {
    code: string
    name: string
    type: ClassType
    startDate?: string
    endDate?: string
    nextExamDate?: string
    notes?: string
  }
): Promise<StudentClass> {
  const response = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, ...payload }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to create class'))
  }

  const data = await response.json()
  if (!data.class) {
    throw new Error('Class was not returned after creation. Please refresh and try again.')
  }

  return data.class
}

export async function updateClass(
  userId: string,
  id: string,
  payload: Partial<{
    code: string
    name: string
    type: ClassType
    startDate: string
    endDate: string
    nextExamDate: string
    notes: string
  }>
): Promise<StudentClass> {
  const response = await fetch(`/api/classes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, ...payload }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to update class'))
  }

  const data = await response.json()
  if (!data.class) {
    throw new Error('Class was not returned after update. Please refresh and try again.')
  }

  return data.class
}

export async function deleteClass(userId: string, id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/classes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    return response.ok
  } catch (error) {
    console.error('[Classes API] Error deleting class:', error)
    return false
  }
}
