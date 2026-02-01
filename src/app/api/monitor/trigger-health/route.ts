import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Monitoring endpoint for database trigger health
export async function GET(req: Request) {
  try {
    // Verify authorization (use a secret token)
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.MONITOR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.error('[Trigger Monitor] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase: any = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get trigger health status
    const { data: healthData, error: healthError } = await supabase
      .rpc('get_trigger_health')

    if (healthError) {
      console.error('[Trigger Monitor] Error fetching trigger health:', healthError)
      return NextResponse.json(
        { error: 'Failed to fetch trigger health', details: healthError.message },
        { status: 500 }
      )
    }

    const health = healthData?.[0] || {}

    // Get orphaned users if any exist
    let orphanedUsers = []
    if (health.orphaned_users_count > 0) {
      const { data: orphanedData, error: orphanedError } = await supabase
        .rpc('get_orphaned_users')

      if (!orphanedError && orphanedData) {
        orphanedUsers = orphanedData
      }
    }

    // Determine alert level
    let alertLevel = 'healthy'
    let alertMessage = 'All systems operational'

    if (!health.trigger_enabled) {
      alertLevel = 'critical'
      alertMessage = 'CRITICAL: Profile creation trigger is disabled'
    } else if (!health.function_exists) {
      alertLevel = 'critical'
      alertMessage = 'CRITICAL: Trigger function is missing'
    } else if (health.orphaned_users_count > 0) {
      // Check if any orphaned users are older than 10 minutes
      const oldOrphans = orphanedUsers.filter((u: any) => u.age_minutes > 10)
      if (oldOrphans.length > 0) {
        alertLevel = 'critical'
        alertMessage = `CRITICAL: ${oldOrphans.length} users without profiles (>10 min old)`
      } else {
        alertLevel = 'warning'
        alertMessage = `WARNING: ${health.orphaned_users_count} users without profiles (<10 min old)`
      }
    }

    // Return comprehensive health report
    return NextResponse.json({
      status: alertLevel,
      message: alertMessage,
      trigger: {
        name: health.trigger_name,
        enabled: health.trigger_enabled,
        function_exists: health.function_exists,
      },
      metrics: {
        orphaned_users_count: health.orphaned_users_count,
        last_user_created_at: health.last_user_created_at,
        last_profile_created_at: health.last_profile_created_at,
      },
      orphaned_users: orphanedUsers,
      health_status: health.health_status,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Trigger Monitor] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Trigger monitoring failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST endpoint to repair orphaned users
export async function POST(req: Request) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.MONITOR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.error('[Trigger Monitor] Unauthorized repair request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase: any = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get orphaned users count before repair
    const { data: beforeHealth } = await supabase.rpc('get_trigger_health')
    const orphanedBefore = beforeHealth?.[0]?.orphaned_users_count || 0

    if (orphanedBefore === 0) {
      return NextResponse.json({
        message: 'No orphaned users to repair',
        repaired: 0,
        timestamp: new Date().toISOString(),
      })
    }

    // Repair orphaned users
    const { data: repairResults, error: repairError } = await supabase
      .rpc('repair_orphaned_users')

    if (repairError) {
      console.error('[Trigger Monitor] Error repairing orphaned users:', repairError)
      return NextResponse.json(
        { error: 'Failed to repair orphaned users', details: repairError.message },
        { status: 500 }
      )
    }

    // Get orphaned users count after repair
    const { data: afterHealth } = await supabase.rpc('get_trigger_health')
    const orphanedAfter = afterHealth?.[0]?.orphaned_users_count || 0

    const successCount = repairResults?.filter((r: any) => r.repair_status.startsWith('SUCCESS')).length || 0
    const failureCount = repairResults?.filter((r: any) => r.repair_status.startsWith('FAILED')).length || 0

    return NextResponse.json({
      message: 'Repair operation complete',
      before: orphanedBefore,
      after: orphanedAfter,
      repaired: successCount,
      failed: failureCount,
      results: repairResults,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Trigger Monitor] Unexpected error during repair:', error)
    return NextResponse.json(
      { 
        error: 'Repair operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
