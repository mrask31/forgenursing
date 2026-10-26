import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/chats/list
 * Returns list of user's chats for sidebar
 */
export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const cursorText = searchParams.get('cursor')
    let cursor: {updatedAt:string;id:string} | null = null
    if (cursorText) {
      const parsed = z.object({updatedAt:z.string().datetime({offset:true}),id:z.string().uuid()}).safeParse((() => { try { return JSON.parse(cursorText) } catch { return null } })())
      if (!parsed.success) return NextResponse.json({error:'Invalid history cursor'},{status:400})
      cursor = parsed.data
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    // Check if we want to include archived chats (for History view)
    const includeArchived = searchParams.get('includeArchived') === 'true'
    
    let query = supabase
      .from('chats')
      .select('id, title, session_type, updated_at, metadata, is_archived')
      .eq('user_id', user.id)
    
    // Only filter by is_archived if we don't want to include archived chats
    if (!includeArchived) {
      query = query.eq('is_archived', false) // Only non-archived chats
    }

    // Filter by classId if provided (stored in metadata.classId)
    // If classId is explicitly "null" (string), filter for General Tutor chats (no classId)
    // If classId is provided (not null), filter for that specific class
    // If classId is not provided at all, return all chats (for History view)
    if (classId === 'null' || classId === '') {
      query = query.is('metadata->>classId', null).is('metadata->>class_id', null)
    } else if (classId) {
      // Specific class: only chats for this class
      query = query.eq('metadata->>classId', classId)
    }
    // If classId is not provided at all, return all chats (no filter)

    if (cursor) query = query.or(`updated_at.lt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.lt.${cursor.id})`)
    const { data: chats, error } = await query
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(51)

    if (error) {
      console.error('[API] Chats list error:', error)
      // Return more detailed error for debugging
      return NextResponse.json({ 
        error: 'Failed to fetch chats',
        details: error.message 
      }, { status: 500 })
    }

    const page = (chats || []).slice(0,50)
    const last = page.at(-1)
    const nextCursor = (chats || []).length > 50 && last ? JSON.stringify({updatedAt:last.updated_at,id:last.id}) : null
    return NextResponse.json({ chats: page, nextCursor }, {headers:{'Cache-Control':'private, no-store'}})
  } catch (error: any) {
    console.error('[API] Chats list critical error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

