'use client';
// ── MQTT Hook ─────────────────────────────────────────────────
// Connects to HiveMQ broker via WebSocket
// Subscribes to hackathon/teamrover/telemetry
// Parses ESP32 JSON payload and sends to /api/hardware

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export interface MQTTSensorPayload {
  mic?: number;        // noise level 0-100
  ldr?: number;        // light level 0-4095 (raw ADC)
  btn?: number;        // button press count
  tilt?: number;       // 0 or 1
  shock?: number;      // 0 or 1
  ir?: number;         // 0 or 1
  temp?: number;       // celsius
  battery?: number;    // 0-100
  device_id?: string;
  ts?: number;         // unix timestamp
}

export interface MQTTStatus {
  connected: boolean;
  lastMessage: string | null;
  messageCount: number;
  lastPayload: MQTTSensorPayload | null;
}

export function useMQTT(userId: string) {
  const [status, setStatus] = useState<MQTTStatus>({
    connected: false, lastMessage: null, messageCount: 0, lastPayload: null,
  });
  const clientRef = useRef<any>(null);
  const { setLatestSensor, setAccessibility } = useSarvyaStore();

  const processPayload = useCallback(async (payload: MQTTSensorPayload) => {
    // Normalize ESP32 raw values to SARVYA format
    const ldrRaw = payload.ldr ?? 2000;
    // LDR: higher raw = darker (inverted). Map 0-4095 to lux 0-500
    const lightLevel = Math.round((1 - ldrRaw / 4095) * 500);
    const noiseLevel = payload.mic ?? 0;
    const movementIntensity = Math.min(1, ((payload.tilt ?? 0) + (payload.shock ?? 0) + (payload.ir ?? 0)) / 3);
    const interactionCount = payload.btn ?? 0;
    const batteryLevel = payload.battery ?? 100;

    const sensorData = {
      userId,
      deviceId: payload.device_id || 'esp32-rover-001',
      lightLevel,
      movementIntensity,
      interactionCount,
      batteryLevel,
      temperature: payload.temp,
      noiseLevel,
    };

    setLatestSensor(sensorData);

    // Apply immediate accessibility adaptations
    if (lightLevel < 100) {
      setAccessibility({ audioLearning: true, mode: 'high-contrast' });
    }
    if (noiseLevel > 70) {
      toast('🔊 High noise detected — focus mode activated', { icon: '🎯' });
    }

    // Persist to Supabase via API
    try {
      await api.hardware.send(sensorData);
    } catch {
      // Silently fail — sensor data is best-effort
    }
  }, [userId, setLatestSensor, setAccessibility]);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    // Dynamically import mqtt to avoid SSR issues
    import('mqtt').then(({ connect }) => {
      const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER || 'wss://broker.hivemq.com:8884/mqtt';
      const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC || 'hackathon/teamrover/telemetry';

      const client = connect(brokerUrl, {
        clientId: `sarvya-web-${userId.slice(0, 8)}-${Date.now()}`,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
      });

      client.on('connect', () => {
        setStatus(s => ({ ...s, connected: true }));
        client.subscribe(topic, { qos: 0 });
        console.log(`[MQTT] Connected to ${brokerUrl}, subscribed to ${topic}`);
      });

      client.on('message', (_topic: string, message: Buffer) => {
        try {
          const payload: MQTTSensorPayload = JSON.parse(message.toString());
          setStatus(s => ({
            ...s,
            lastMessage: new Date().toISOString(),
            messageCount: s.messageCount + 1,
            lastPayload: payload,
          }));
          processPayload(payload);
        } catch {
          // Ignore malformed messages
        }
      });

      client.on('disconnect', () => {
        setStatus(s => ({ ...s, connected: false }));
      });

      client.on('error', (err: Error) => {
        console.warn('[MQTT] Connection error:', err.message);
        setStatus(s => ({ ...s, connected: false }));
      });

      clientRef.current = client;
    }).catch(() => {
      console.warn('[MQTT] mqtt package not available');
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, [userId, processPayload]);

  // Manual publish (for testing)
  const publish = useCallback((topic: string, payload: object) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish(topic, JSON.stringify(payload));
    }
  }, []);

  return { status, publish };
}
