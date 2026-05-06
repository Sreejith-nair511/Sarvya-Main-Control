import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get('userId') || userId;
    const db = getAdminClient();

    const { data } = await db.from('sessions').select('*').eq('user_id', targetId).order('start_time', { ascending: false }).limit(20);
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userId: targetId = userId, subject = 'General', platform = 'web', topicsAttempted = [] } = body;

    const db = getAdminClient();
    await db.from('profiles').upsert({ id: targetId, name: 'Learner' }, { onConflict: 'id', ignoreDuplicates: true });

    const { data } = await db.from('sessions').insert({
      user_id: targetId, subject, platform,
      topics_attempted: topicsAttempted,
      performance_score: 0, completion_rate: 0,
    }).select().single();

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, performanceScore, completionRate, topicsAttempted, endTime } = body;

    const db = getAdminClient();
    const { data } = await db.from('sessions').update({
      performance_score: performanceScore,
      completion_rate: completionRate,
      topics_attempted: topicsAttempted,
      end_time: endTime || new Date().toISOString(),
    }).eq('id', id).select().single();

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
