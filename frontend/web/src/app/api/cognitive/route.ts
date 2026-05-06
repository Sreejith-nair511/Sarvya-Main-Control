import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminClient } from '@/lib/supabase';

// GET /api/cognitive?userId=x — trend (or history if &history=1)
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get('userId') || userId;
    const wantHistory = req.nextUrl.searchParams.get('history') === '1';
    const db = getAdminClient();

    const { data: events } = await db
      .from('cognitive_events')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(wantHistory ? 100 : 20);

    const recent = (events || []).reverse();

    if (wantHistory) return NextResponse.json(recent);

    if (recent.length < 2) return NextResponse.json({ trend: 'stable', averageScore: 50, recentEvents: recent });

    const avgScore = Math.round(recent.reduce((a: number, e: any) => a + e.score, 0) / recent.length);
    const half = Math.floor(recent.length / 2);
    const firstAvg = recent.slice(0, half).reduce((a: number, e: any) => a + e.score, 0) / half;
    const secondAvg = recent.slice(half).reduce((a: number, e: any) => a + e.score, 0) / (recent.length - half);

    const trend = secondAvg < firstAvg - 5 ? 'improving' : secondAvg > firstAvg + 5 ? 'worsening' : 'stable';

    return NextResponse.json({ trend, averageScore: avgScore, recentEvents: recent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/cognitive — evaluate
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userId: targetId = userId, responseTime = 3000, errorRate = 0, sessionDuration = 10, lightLevel, movementLevel, interactionRate } = body;

    // Score calculation
    let score = 30;
    score += Math.min(30, (responseTime / 10000) * 30);
    score += errorRate * 25;
    score += Math.min(20, (sessionDuration / 45) * 20);
    if (movementLevel !== undefined) score += movementLevel * 15;
    score = Math.min(100, Math.round(score));

    // State detection
    let state = 'optimal';
    if (responseTime > 8000 && errorRate > 0.5 && sessionDuration > 25) state = 'overloaded';
    else if (responseTime > 8000 && errorRate < 0.3) state = 'distracted';
    else if (interactionRate !== undefined && interactionRate < 2) state = 'low-engagement';
    else if (movementLevel !== undefined && movementLevel > 0.7) state = 'distracted';
    else if (errorRate < 0.2 && responseTime < 4000) state = 'focused';

    // Recommendation
    let action = 'none', reason = 'Cognitive load is within optimal range.';
    let newDifficulty, newFormat, breakDurationMinutes;

    if (state === 'overloaded' || score > 80) {
      action = 'take-break'; reason = 'Cognitive load is too high. A short break will help.';
      breakDurationMinutes = 5; newFormat = 'simplified';
    } else if (state === 'distracted') {
      action = 'change-format'; reason = 'Distraction detected. Switching to interactive content.';
      newFormat = 'interactive';
    } else if (state === 'low-engagement') {
      action = 'increase-engagement'; reason = 'Low engagement. Adding interactive elements.';
      newFormat = 'interactive';
    } else if (score > 70) {
      action = 'shorten-session'; reason = 'Session is getting long. Consider wrapping up.';
    }

    const db = getAdminClient();
    await db.from('profiles').upsert({ id: targetId, name: 'Learner' }, { onConflict: 'id', ignoreDuplicates: true });
    await db.from('cognitive_events').insert({
      user_id: targetId,
      state,
      score,
      indicators: { responseTime, errorRate, sessionDuration, lightLevel, movementLevel, interactionRate },
      recommendation: { action, reason, newDifficulty, newFormat, breakDurationMinutes },
    });

    // Update twin cognitive load
    await db.from('twin_states').update({ cognitive_load_score: score, updated_at: new Date().toISOString() }).eq('user_id', targetId);

    return NextResponse.json({
      state, score,
      recommendation: { action, reason, newDifficulty, newFormat, breakDurationMinutes },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
