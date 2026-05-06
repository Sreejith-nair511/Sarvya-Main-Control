import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get('userId') || userId;
    const db = getAdminClient();

    const { data } = await db.from('profiles').select('accessibility').eq('id', targetId).single();
    return NextResponse.json(data?.accessibility || {});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userId: targetId = userId, ...prefs } = body;

    const db = getAdminClient();
    await db.from('profiles').upsert({ id: targetId, name: 'Learner', accessibility: prefs, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    return NextResponse.json(prefs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
