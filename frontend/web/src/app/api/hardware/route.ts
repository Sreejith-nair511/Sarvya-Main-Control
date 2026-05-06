import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get('userId') || userId;
    const db = getAdminClient();

    const { data } = await db
      .from('sensor_data')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(20);

    const recent = (data || []).reverse();
    if (recent.length === 0) return NextResponse.json({ summary: null, recent: [] });

    const avgLight    = recent.reduce((a: number, d: any) => a + d.light_level, 0) / recent.length;
    const avgMovement = recent.reduce((a: number, d: any) => a + d.movement_intensity, 0) / recent.length;
    const totalInter  = recent.reduce((a: number, d: any) => a + d.interaction_count, 0);
    const latest      = recent[recent.length - 1];

    const isDim    = avgLight < 100;
    const isActive = avgMovement > 0.4;
    const profile  = isDim && isActive ? 'dim-active' : isDim ? 'dim-calm' : isActive ? 'bright-active' : 'bright-calm';
    const format   = isDim ? 'audio' : isActive ? 'simplified' : totalInter > 50 ? 'interactive' : 'text';

    return NextResponse.json({
      summary: { averageLightLevel: Math.round(avgLight), averageMovement: Math.round(avgMovement * 100) / 100, totalInteractions: totalInter, batteryLevel: latest.battery_level, environmentProfile: profile, recommendedFormat: format },
      recent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userId: targetId = userId, deviceId = 'rover-001', lightLevel = 200, movementIntensity = 0, interactionCount = 0, batteryLevel = 100, temperature } = body;

    const db = getAdminClient();
    await db.from('profiles').upsert({ id: targetId, name: 'Learner' }, { onConflict: 'id', ignoreDuplicates: true });
    await db.from('sensor_data').insert({
      device_id: deviceId, user_id: targetId,
      light_level: lightLevel, movement_intensity: movementIntensity,
      interaction_count: interactionCount, battery_level: batteryLevel,
      temperature, noise_level: body.noiseLevel ?? 0,
    });

    // Build decisions
    const decisions: any[] = [];
    if (lightLevel < 100)          decisions.push({ trigger: 'low-light',        action: 'Switch to audio learning',    contentFormatOverride: 'audio',       notifyUser: true,  message: `Low light (${Math.round(lightLevel)} lux). Switching to audio.` });
    if (movementIntensity > 0.7)   decisions.push({ trigger: 'high-movement',    action: 'Reduce cognitive load',       contentFormatOverride: 'simplified',  notifyUser: true,  message: 'Movement detected. Simplifying content.' });
    if (interactionCount > 30)     decisions.push({ trigger: 'high-interaction', action: 'Increase engagement',         contentFormatOverride: 'interactive', notifyUser: false, message: 'High interaction. Boosting engagement.' });
    if (interactionCount < 2)      decisions.push({ trigger: 'low-interaction',  action: 'Re-engage learner',           contentFormatOverride: 'visual',      notifyUser: true,  message: 'Low interaction. Switching to visual.' });

    return NextResponse.json({ received: body, decisions, batteryAdaptation: { shouldReduceFeatures: batteryLevel < 25, message: batteryLevel < 10 ? 'Battery critical. Text-only mode.' : batteryLevel < 25 ? 'Battery low. Reducing effects.' : undefined } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
