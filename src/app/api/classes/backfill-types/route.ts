import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inferCourseType } from '@/lib/course-utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/classes/backfill-types
 * Runs inferCourseType against all courses with type 'other' and updates them.
 * Authenticated — only updates courses belonging to the current user.
 */
export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user's courses with type 'other'
    const { data: classes, error } = await supabase
      .from('student_classes')
      .select('id, code, name, type')
      .eq('user_id', user.id)
      .eq('type', 'other');

    if (error) {
      console.error('[BackfillTypes] Error fetching classes:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    if (!classes || classes.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No courses with type "other" found' });
    }

    let updated = 0;
    const updates: Array<{ id: string; code: string; from: string; to: string }> = [];

    for (const cls of classes) {
      const inferred = inferCourseType(cls.code || '', cls.name || '');
      if (inferred && inferred !== 'other') {
        const { error: updateError } = await supabase
          .from('student_classes')
          .update({ type: inferred })
          .eq('id', cls.id)
          .eq('user_id', user.id);

        if (!updateError) {
          updated++;
          updates.push({ id: cls.id, code: cls.code, from: 'other', to: inferred });
        } else {
          console.error('[BackfillTypes] Update error for', cls.id, updateError);
        }
      }
    }

    console.log('[BackfillTypes] Updated', updated, 'of', classes.length, 'courses:', updates);
    return NextResponse.json({ updated, total: classes.length, updates });
  } catch (error: any) {
    console.error('[BackfillTypes] Error:', error?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
