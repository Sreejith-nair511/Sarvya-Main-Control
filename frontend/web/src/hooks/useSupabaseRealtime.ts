'use client';
// ── Supabase Realtime hook ────────────────────────────────────
// Subscribes to twin_states, cognitive_events, sensor_data
// and pushes live updates into the Zustand store.

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import toast from 'react-hot-toast';

export function useSupabaseRealtime() {
  const { userId, setTwin, setCognitiveLoad, setLatestSensor, setAccessibility } = useSarvyaStore();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`sarvya-realtime-${userId}`)

      // Twin state changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'twin_states',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new) {
          const t = payload.new as any;
          setTwin({
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
          });
        }
      })

      // Cognitive events
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cognitive_events',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new) {
          const e = payload.new as any;
          setCognitiveLoad({
            state: e.state,
            score: e.score,
            recommendation: e.recommendation,
            timestamp: e.created_at,
          });
          // Alert on overload
          if (e.state === 'overloaded') {
            toast('🧠 Cognitive overload detected — take a break!', {
              icon: '⚠️',
              style: { background: '#1a0a0a', border: '1px solid #f43f5e', color: '#fca5a5' },
            });
          }
        }
      })

      // Sensor data
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_data',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new) {
          const s = payload.new as any;
          setLatestSensor({
            lightLevel: s.light_level,
            movementIntensity: s.movement_intensity,
            interactionCount: s.interaction_count,
            batteryLevel: s.battery_level,
            temperature: s.temperature,
            deviceId: s.device_id,
            timestamp: s.created_at,
          });
          // Auto-apply hardware-driven accessibility
          if (s.light_level < 100) {
            setAccessibility({ audioLearning: true, mode: 'high-contrast' });
            toast('💡 Low light — audio mode activated', { icon: '🔊' });
          }
          if (s.movement_intensity > 0.7) {
            toast('📳 Movement detected — simplifying content', { icon: '⚡' });
          }
        }
      })

      // Profile/accessibility changes
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        if (payload.new?.accessibility) {
          setAccessibility(payload.new.accessibility);
        }
      })

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Connected to Supabase realtime');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
