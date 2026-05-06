// ── MQTT Bridge API Route ─────────────────────────────────────
// Called by the frontend useMQTT hook to persist sensor data.
// Also called directly by the ESP32 via HTTP if MQTT is unavailable.
// POST /api/mqtt-bridge

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      deviceId = 'esp32-rover-001',
      // Raw ESP32 fields
      mic,   ldr,   btn,   tilt,  shock, ir, battery, temp, ts,
      // Or pre-normalized fields
      lightLevel, movementIntensity, interactionCount, batteryLevel, noiseLevel, temperature,
    } = body;

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // Normalize raw ESP32 values if present
    const normalizedLight    = lightLevel    ?? (ldr  !== undefined ? Math.round((1 - ldr / 4095) * 500) : 200);
    const normalizedMovement = movementIntensity ?? (tilt !== undefined ? Math.min(1, (tilt + (shock ?? 0) + (ir ?? 0)) / 3) : 0);
    const normalizedInteract = interactionCount ?? (btn ?? 0);
    const normalizedBattery  = batteryLevel  ?? (battery ?? 100);
    const normalizedTemp     = temperature   ?? temp;
    const normalizedNoise    = noiseLevel    ?? (mic ?? 0);

    const db = getAdminClient();

    // Ensure profile exists
    await db.from('profiles').upsert(
      { id: userId, name: 'Learner' },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    // Store sensor data
    await db.from('sensor_data').insert({
      device_id:          deviceId,
      user_id:            userId,
      light_level:        normalizedLight,
      movement_intensity: normalizedMovement,
      interaction_count:  normalizedInteract,
      battery_level:      normalizedBattery,
      temperature:        normalizedTemp,
    });

    // Build AI adaptation decisions
    const decisions: any[] = [];

    if (normalizedLight < 100) {
      decisions.push({
        trigger: 'low-light',
        action: 'Switch to audio learning + high contrast',
        accessibilityOverride: { audioLearning: true, mode: 'high-contrast' },
        message: `Low light (${Math.round(normalizedLight)} lux) — audio mode activated`,
      });
    }
    if (normalizedNoise > 70) {
      decisions.push({
        trigger: 'high-noise',
        action: 'Reduce difficulty + focus warning',
        difficultyOverride: 'easy',
        message: `High noise (${normalizedNoise}%) — reducing cognitive load`,
      });
    }
    if (normalizedMovement > 0.7) {
      decisions.push({
        trigger: 'high-movement',
        action: 'Switch to interactive/game mode',
        contentFormatOverride: 'interactive',
        message: 'Movement detected — switching to interactive mode',
      });
    }
    if (normalizedInteract > 30) {
      decisions.push({
        trigger: 'high-interaction',
        action: 'Increase engagement',
        contentFormatOverride: 'interactive',
        message: 'High interaction — boosting engagement',
      });
    }
    if (normalizedInteract < 2) {
      decisions.push({
        trigger: 'low-interaction',
        action: 'Re-engage with visual content',
        contentFormatOverride: 'visual',
        message: 'Low interaction — switching to visual content',
      });
    }

    // Apply accessibility overrides to twin if needed
    if (decisions.length > 0) {
      const accessOverride = decisions.find(d => d.accessibilityOverride)?.accessibilityOverride;
      if (accessOverride) {
        await db.from('profiles')
          .update({ accessibility: accessOverride, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
    }

    return NextResponse.json({
      success: true,
      normalized: {
        lightLevel: normalizedLight,
        movementIntensity: normalizedMovement,
        interactionCount: normalizedInteract,
        batteryLevel: normalizedBattery,
        noiseLevel: normalizedNoise,
      },
      decisions,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[MQTT Bridge]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
