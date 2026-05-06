// ============================================================
// Hardware Integration Service
// Processes rover sensor data and drives accessibility
// decisions based on environment (light, movement, interaction)
// ============================================================

import {
  RoverSensorData,
  HardwareAccessibilityDecision,
  ContentFormat,
  DifficultyLevel,
} from '../../../shared/types';
import { SENSOR_THRESHOLDS } from '../../../shared/constants';
import { store } from '../store/inMemoryStore';

// ── Decision engine ──────────────────────────────────────────

export function processRoverData(data: RoverSensorData): HardwareAccessibilityDecision[] {
  store.addSensorData(data);

  const decisions: HardwareAccessibilityDecision[] = [];

  // Low light → switch to audio learning
  if (data.lightLevel < SENSOR_THRESHOLDS.LOW_LIGHT_LUX) {
    decisions.push({
      trigger: 'low-light',
      action: 'Switch to audio learning mode',
      contentFormatOverride: 'audio',
      notifyUser: true,
      message: `Low light detected (${data.lightLevel} lux). Switching to audio learning for better accessibility.`,
    });
  }

  // High movement → reduce cognitive load
  if (data.movementIntensity > SENSOR_THRESHOLDS.HIGH_MOVEMENT_INTENSITY) {
    decisions.push({
      trigger: 'high-movement',
      action: 'Reduce cognitive load',
      difficultyOverride: 'easy',
      contentFormatOverride: 'simplified',
      notifyUser: true,
      message: 'Movement detected. Simplifying content to reduce cognitive load.',
    });
  }

  // High interaction → increase engagement
  if (data.interactionCount > SENSOR_THRESHOLDS.HIGH_INTERACTION_PER_MIN) {
    decisions.push({
      trigger: 'high-interaction',
      action: 'Increase engagement level',
      contentFormatOverride: 'interactive',
      notifyUser: false,
      message: 'High interaction detected. Increasing engagement with interactive content.',
    });
  }

  // Low interaction → check engagement
  if (data.interactionCount < SENSOR_THRESHOLDS.LOW_INTERACTION_PER_MIN) {
    decisions.push({
      trigger: 'low-interaction',
      action: 'Check and boost engagement',
      contentFormatOverride: 'visual',
      notifyUser: true,
      message: 'Low interaction detected. Switching to visual content to re-engage.',
    });
  }

  return decisions;
}

// ── Aggregate sensor summary ─────────────────────────────────

export interface SensorSummary {
  deviceId: string;
  averageLightLevel: number;
  averageMovement: number;
  totalInteractions: number;
  batteryLevel: number;
  environmentProfile: 'bright-calm' | 'bright-active' | 'dim-calm' | 'dim-active';
  recommendedFormat: ContentFormat;
  dataPoints: number;
}

export function getSensorSummary(deviceId: string): SensorSummary | null {
  const history = store.getSensorHistory(deviceId);
  if (history.length === 0) return null;

  const recent = history.slice(-20);
  const avgLight = recent.reduce((a, d) => a + d.lightLevel, 0) / recent.length;
  const avgMovement = recent.reduce((a, d) => a + d.movementIntensity, 0) / recent.length;
  const totalInteractions = recent.reduce((a, d) => a + d.interactionCount, 0);
  const latest = recent[recent.length - 1];

  const isDim = avgLight < SENSOR_THRESHOLDS.LOW_LIGHT_LUX;
  const isActive = avgMovement > 0.4;

  let environmentProfile: SensorSummary['environmentProfile'];
  if (!isDim && !isActive) environmentProfile = 'bright-calm';
  else if (!isDim && isActive) environmentProfile = 'bright-active';
  else if (isDim && !isActive) environmentProfile = 'dim-calm';
  else environmentProfile = 'dim-active';

  let recommendedFormat: ContentFormat = 'text';
  if (isDim) recommendedFormat = 'audio';
  else if (isActive) recommendedFormat = 'simplified';
  else if (totalInteractions > 50) recommendedFormat = 'interactive';

  return {
    deviceId,
    averageLightLevel: Math.round(avgLight),
    averageMovement: Math.round(avgMovement * 100) / 100,
    totalInteractions,
    batteryLevel: latest.batteryLevel,
    environmentProfile,
    recommendedFormat,
    dataPoints: recent.length,
  };
}

// ── Battery-aware adaptation ─────────────────────────────────

export function getBatteryAdaptation(batteryLevel: number): {
  shouldReduceFeatures: boolean;
  message?: string;
} {
  if (batteryLevel < 10) {
    return {
      shouldReduceFeatures: true,
      message: 'Battery critically low. Switching to text-only mode to conserve power.',
    };
  }
  if (batteryLevel < 25) {
    return {
      shouldReduceFeatures: true,
      message: 'Battery low. Reducing visual effects to conserve power.',
    };
  }
  return { shouldReduceFeatures: false };
}
