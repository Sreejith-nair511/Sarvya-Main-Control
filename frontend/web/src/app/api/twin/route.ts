import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminClient } from '@/lib/supabase';

const DIFFICULTY = ['very-easy', 'easy', 'medium', 'hard', 'very-hard'] as const;

function shift(d: string, delta: number): string {
  const i = DIFFICULTY.indexOf(d as any);
  return DIFFICULTY[Math.max(0, Math.min(DIFFICULTY.length - 1, i + delta))];
}

function ema(current: number, next: number, alpha = 0.3) {
  return Math.round(alpha * next + (1 - alpha) * current);
}

// GET /api/twin?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get('userId') || userId;
    const db = getAdminClient();

    // Ensure profile exists
    await db.from('profiles').upsert({ id: targetId, name: 'Learner' }, { onConflict: 'id', ignoreDuplicates: true });

    let { data: twin } = await db.from('twin_states').select('*').eq('user_id', targetId).single();

    if (!twin) {
      const { data } = await db.from('twin_states').insert({
        user_id: targetId,
        current_difficulty: 'medium',
        understanding_score: 50,
        engagement_score: 50,
        cognitive_load_score: 30,
        recommended_format: 'text',
        recommended_style: 'step-by-step',
        predicted_weak_areas: [],
        adaptation_history: [],
      }).select().single();
      twin = data;
    }

    return NextResponse.json(normalizeTwin(twin));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/twin — update after session
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userId: targetId = userId, sessionScore, topicsAttempted = [], cognitiveLoadScore = 30, audioLearningEnabled = false } = body;

    const db = getAdminClient();
    await db.from('profiles').upsert({ id: targetId, name: 'Learner' }, { onConflict: 'id', ignoreDuplicates: true });

    let { data: twin } = await db.from('twin_states').select('*').eq('user_id', targetId).single();
    if (!twin) {
      await db.from('twin_states').insert({ user_id: targetId, current_difficulty: 'medium', understanding_score: 50, engagement_score: 50, cognitive_load_score: 30, recommended_format: 'text', recommended_style: 'step-by-step', predicted_weak_areas: [], adaptation_history: [] });
      const { data } = await db.from('twin_states').select('*').eq('user_id', targetId).single();
      twin = data;
    }

    const newUnderstanding = ema(twin.understanding_score, sessionScore);
    let newDifficulty = twin.current_difficulty;
    if (sessionScore >= 80) newDifficulty = shift(twin.current_difficulty, 1);
    else if (sessionScore <= 40) newDifficulty = shift(twin.current_difficulty, -1);

    const newFormat = audioLearningEnabled ? 'audio'
      : cognitiveLoadScore > 80 ? 'simplified'
      : newUnderstanding < 40 ? 'visual'
      : newUnderstanding < 60 ? 'interactive'
      : 'text';

    const newStyle = newUnderstanding < 40 ? 'example'
      : newUnderstanding < 65 ? 'step-by-step'
      : 'diagram';

    const history = Array.isArray(twin.adaptation_history) ? twin.adaptation_history : [];
    if (newDifficulty !== twin.current_difficulty || newFormat !== twin.recommended_format) {
      history.push({
        timestamp: new Date().toISOString(),
        trigger: 'performance',
        previousDifficulty: twin.current_difficulty,
        newDifficulty,
        previousFormat: twin.recommended_format,
        newFormat,
        reason: `Score ${sessionScore}% → ${twin.current_difficulty} → ${newDifficulty}`,
      });
    }

    const { data: updated } = await db.from('twin_states').update({
      current_difficulty: newDifficulty,
      understanding_score: newUnderstanding,
      cognitive_load_score: cognitiveLoadScore,
      recommended_format: newFormat,
      recommended_style: newStyle,
      adaptation_history: history.slice(-50),
      updated_at: new Date().toISOString(),
    }).eq('user_id', targetId).select().single();

    return NextResponse.json(normalizeTwin(updated));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function normalizeTwin(t: any) {
  if (!t) return null;
  return {
    userId: t.user_id,
    currentDifficulty: t.current_difficulty,
    predictedWeakAreas: t.predicted_weak_areas || [],
    understandingScore: t.understanding_score,
    engagementScore: t.engagement_score,
    cognitiveLoadScore: t.cognitive_load_score,
    recommendedFormat: t.recommended_format,
    recommendedStyle: t.recommended_style,
    adaptationHistory: t.adaptation_history || [],
    lastUpdated: t.updated_at,
  };
}
