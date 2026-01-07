import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * POST /api/binder/toggle
 * Toggle the active state of a document
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    const { filename, isActive } = await req.json()

    if (!filename || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: filename and isActive required' },
        { status: 400 }
      )
    }

    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get existing documents
    const { data: existingDocs, error: fetchError } = await supabase
      .from('documents')
      .select('id, metadata')
      .eq('user_id', user.id)
      .eq('metadata->>filename', filename)

    if (fetchError) {
      console.error('[Toggle API] Failed to fetch documents:', fetchError)
      return NextResponse.json(
        { error: `Failed to fetch documents: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!existingDocs || existingDocs.length === 0) {
      return NextResponse.json(
        { error: `Document "${filename}" not found` },
        { status: 404 }
      )
    }

    // 3. Update each chunk's metadata
    const updatePromises = existingDocs.map(async (doc) => {
      const currentMetadata = doc.metadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        is_active: isActive
      }

      const { error } = await supabase
        .from('documents')
        .update({ metadata: updatedMetadata })
        .eq('id', doc.id)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(`Failed to update chunk ${doc.id}: ${error.message}`)
      }
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      filename,
      isActive
    })
  } catch (error: any) {
    console.error('[Toggle API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

