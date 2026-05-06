// ============================================================
// Cognitive Load Balancer Service
// Uses performance data + sensor data to detect overload,
// distraction, and low focus — then adapts the session.
// ============================================================

import {
  CognitiveLoadData,
  CognitiveAdaptation,
  CognitiveState,
  RoverSensorData,
  DifficultyLevel,
  ContentFormat,
} from '../../../shared/types';
import {
  COGNITIVE_LOAD,
  SENSOR_THRESHOLDS,
} from '../../../shared/constants';
import { store } from '../store/inMemoryStore';
import { v4 as uuidv4 } from 'uuid';

// ── State detection ──────────────────────────────────────────

export interface CognitiveIndicators {
  responseTime: number;    // ms — time to answer questions
  errorRate: number;       // 0–1
  sessionDuration: number; // minutes
  lightLevel?: number;
  movementLevel?: number;
  interactionRate?: number;
}

function detectCognitiveState(indicators: CognitiveIndicators): CognitiveState {
  const { responseTime, errorRate, sessionDuration, movementLevel, interactionRate } = indicators;

  // Overload: slow responses + high errors + long session
  if (
    responseTime > COGNITIVE_LOAD.DISTRACTION_RESPONSE_TIME_MS &&
    errorRate > 0.5 &&
    sessionDuration > COGNITIVE_LOAD.BREAK_TRIGGER_MINUTES
  ) {
    return 'overloaded';
  }

  // Distracted: very slow responses but low errors (not trying)
  if (responseTime > COGNITIVE_LOAD.DISTRACTION_RESPONSE_TIME_MS && errorRate < 0.3) {
    return 'distracted';
  }

  // Low engagement: low interaction rate
  if (interactionRate !== undefined && interactionRate < SENSOR_THRESHOLDS.LOW_INTERACTION_PER_MIN) {
    return 'low-engagement';
  }

  // High movement → distracted
  if (movementLevel !== undefined && movementLevel > SENSOR_THRESHOLDS.HIGH_MOVEMENT_INTENSITY) {
    return 'distracted';
  }

  // Optimal
  if (errorRate < 0.2 && responseTime < 4000) {
    return 'focused';
  }

  return 'optimal';
}

// ── Score calculation ────────────────────────────────────────

function calculateCognitiveScore(indicators: CognitiveIndicators): number {
  let score = 30; // baseline

  // Response time contribution (0–30 points)
  const rtScore = Math.min(30, (indicators.responseTime / 10000) * 30);
  score += rtScore;

  // Error rate contribution (0–25 points)
  score += indicators.errorRate * 25;

  // Session duration contribution (0–20 points)
  const durationScore = Math.min(20, (indicators.sessionDuration / COGNITIVE_LOAD.MAX_SESSION_MINUTES) * 20);
  score += durationScore;

  // Movement contribution (0–15 points)
  if (indicators.movementLevel !== undefined) {
    score += indicators.movementLevel * 15;
  }

  return Math.min(100, Math.round(score));
}

// ── Adaptation recommendation ────────────────────────────────

function recommendAdaptation(
  state: CognitiveState,
  score: number,
  currentDifficulty: DifficultyLevel
): CognitiveAdaptation {
  if (state === 'overloaded' || score > COGNITIVE_LOAD.OVERLOAD_THRESHOLD) {
    return {
      action: 'take-break',
      reason: 'Cognitive load is too high. A short break will help consolidate learning.',
      breakDurationMinutes: 5,
      newDifficulty: shiftDifficulty(currentDifficulty, -1),
      newFormat: 'simplified',
    };
  }

  if (state === 'distracted') {
    return {
      action: 'change-format',
      reason: 'Distraction detected. Switching to a more engaging format.',
      newFormat: 'interactive',
      newDifficulty: currentDifficulty,
    };
  }

  if (state === 'low-engagement') {
    return {
      action: 'increase-engagement',
      reason: 'Low engagement detected. Adding interactive elements.',
      newFormat: 'interactive',
      newDifficulty: shiftDifficulty(currentDifficulty, -1),
    };
  }

  if (score > 70) {
    return {
      action: 'shorten-session',
      reason: 'Session is getting long. Consider wrapping up soon.',
      newDifficulty: currentDifficulty,
    };
  }

  return {
    action: 'none',
    reason: 'Cognitive load is within optimal range.',
    newDifficulty: currentDifficulty,
  };
}

function shiftDifficulty(current: DifficultyLevel, delta: number): DifficultyLevel {
  const levels: DifficultyLevel[] = ['very-easy', 'easy', 'medium', 'hard', 'very-hard'];
  const idx = levels.indexOf(current);
  return levels[Math.max(0, Math.min(levels.length - 1, idx + delta))];
}

// ── Hardware-driven cognitive decisions ──────────────────────

export function applyHardwareContext(
  indicators: CognitiveIndicators,
  sensorData: RoverSensorData | null
): CognitiveIndicators {
  if (!sensorData) return indicators;

  return {
    ...indicators,
    lightLevel: sensorData.lightLevel,
    movementLevel: sensorData.movementIntensity,
    interactionRate: sensorData.interactionCount,
  };
}

// ── Main cognitive load evaluation ──────────────────────────

export function evaluateCognitiveLoad(
  userId: string,
  indicators: CognitiveIndicators,
  currentDifficulty: DifficultyLevel = 'medium'
): CognitiveLoadData {
  const state = detectCognitiveState(indicators);
  const score = calculateCognitiveScore(indicators);
  const recommendation = recommendAdaptation(state, score, currentDifficulty);

  const event: CognitiveLoadData = {
    userId,
    timestamp: new Date().toISOString(),
    state,
    score,
    indicators: {
      responseTime: indicators.responseTime,
      errorRate: indicators.errorRate,
      sessionDuration: indicators.sessionDuration,
      lightLevel: indicators.lightLevel,
      movementLevel: indicators.movementLevel,
      interactionRate: indicators.interactionRate,
    },
    recommendation,
  };

  store.addCognitiveEvent(userId, event);

  // Update twin's cognitive load score
  store.updateTwin(userId, { cognitiveLoadScore: score });

  return event;
}

// ── Trend analysis ───────────────────────────────────────────

export function getCognitiveLoadTrend(userId: string): {
  trend: 'improving' | 'stable' | 'worsening';
  averageScore: number;
  recentEvents: CognitiveLoadData[];
} {
  const history = store.getCognitiveHistory(userId);
  const recent = history.slice(-10);

  if (recent.length < 2) {
    return { trend: 'stable', averageScore: 50, recentEvents: recent };
  }

  const avgScore = recent.reduce((a, e) => a + e.score, 0) / recent.length;
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));

  const firstAvg = firstHalf.reduce((a, e) => a + e.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, e) => a + e.score, 0) / secondHalf.length;

  let trend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (secondAvg < firstAvg - 5) trend = 'improving'; // lower score = less load = better
  else if (secondAvg > firstAvg + 5) trend = 'worsening';

  return { trend, averageScore: Math.round(avgScore), recentEvents: recent };
}
