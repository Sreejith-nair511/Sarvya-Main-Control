import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get('userId') || userId;
    const db = getAdminClient();

    const { data: twin } = await db.from('twin_states').select('*').eq('user_id', targetId).single();
    const { data: sessions } = await db.from('sessions').select('performance_score, topics_attempted').eq('user_id', targetId).order('start_time', { ascending: false }).limit(5);

    if (!twin) return NextResponse.json({ riskLevel: 'low', predictedWeakAreas: [], recommendedInterventions: [], confidenceScore: 0 });

    const recent = sessions || [];
    const avgScore = recent.length > 0 ? recent.reduce((a: number, s: any) => a + s.performance_score, 0) / recent.length : 50;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgScore < 40 || twin.cognitive_load_score > 80) riskLevel = 'high';
    else if (avgScore < 60) riskLevel = 'medium';

    const interventions: string[] = [];
    if (riskLevel === 'high') {
      interventions.push('Switch to simplified content format');
      interventions.push('Reduce session duration to 15 minutes');
      interventions.push('Enable visual diagrams for all topics');
    } else if (riskLevel === 'medium') {
      interventions.push('Add more examples to explanations');
      interventions.push('Review weak areas with step-by-step guides');
    }
    if (twin.cognitive_load_score > 75) interventions.push('Schedule a break — cognitive load is high');

    return NextResponse.json({
      riskLevel,
      predictedWeakAreas: twin.predicted_weak_areas || [],
      recommendedInterventions: interventions,
      confidenceScore: Math.min(100, recent.length * 20),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
