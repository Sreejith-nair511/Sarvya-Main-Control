// ============================================================
// AI Learning Twin Service
// Predicts learning difficulties, detects weak understanding,
// and adapts difficulty/format/style in real time.
// ============================================================

import {
  LearningTwinState,
  LearningSession,
  DifficultyLevel,
  ContentFormat,
  ExplanationStyle,
  TwinAdaptation,
} from '../../../shared/types';
import {
  DIFFICULTY_LEVELS,
  DIFFICULTY_PROGRESSION,
  COGNITIVE_LOAD,
} from '../../../shared/constants';
import { store } from '../store/inMemoryStore';

// ── Difficulty helpers ───────────────────────────────────────

function getDifficultyIndex(d: DifficultyLevel): number {
  return DIFFICULTY_LEVELS.indexOf(d);
}

function shiftDifficulty(current: DifficultyLevel, delta: number): DifficultyLevel {
  const idx = getDifficultyIndex(current);
  const newIdx = Math.max(0, Math.min(DIFFICULTY_LEVELS.length - 1, idx + delta));
  return DIFFICULTY_LEVELS[newIdx];
}

// ── Weak area detection ──────────────────────────────────────

/**
 * Analyses recent sessions to identify topics where the user
 * consistently scores below 50%.
 */
function detectWeakAreas(sessions: LearningSession[]): string[] {
  const topicScores: Record<string, number[]> = {};

  for (const session of sessions.slice(-10)) {
    for (const topic of session.topicsAttempted) {
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(session.performanceScore);
    }
  }

  return Object.entries(topicScores)
    .filter(([, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return avg < 50;
    })
    .map(([topic]) => topic);
}

// ── Format recommendation ────────────────────────────────────

/**
 * Recommends the best content format based on understanding
 * score and cognitive load.
 */
function recommendFormat(
  understandingScore: number,
  cognitiveLoadScore: number,
  accessibilityAudioEnabled: boolean
): ContentFormat {
  if (accessibilityAudioEnabled) return 'audio';
  if (cognitiveLoadScore > COGNITIVE_LOAD.OVERLOAD_THRESHOLD) return 'simplified';
  if (understandingScore < 40) return 'visual';
  if (understandingScore < 60) return 'interactive';
  return 'text';
}

// ── Style recommendation ─────────────────────────────────────

function recommendStyle(
  understandingScore: number,
  weakAreas: string[]
): ExplanationStyle {
  if (weakAreas.length > 3) return 'story';
  if (understandingScore < 40) return 'example';
  if (understandingScore < 65) return 'step-by-step';
  return 'diagram';
}

// ── Understanding score update ───────────────────────────────

/**
 * Blends the latest session score into the running understanding
 * score using exponential moving average (α = 0.3).
 */
function updateUnderstandingScore(current: number, sessionScore: number): number {
  const alpha = 0.3;
  return Math.round(alpha * sessionScore + (1 - alpha) * current);
}

// ── Main twin update ─────────────────────────────────────────

export interface TwinUpdateInput {
  userId: string;
  sessionScore: number;
  topicsAttempted: string[];
  cognitiveLoadScore: number;
  audioLearningEnabled?: boolean;
}

export function updateLearningTwin(input: TwinUpdateInput): LearningTwinState | null {
  const twin = store.getTwin(input.userId);
  const user = store.getUser(input.userId);
  if (!twin || !user) return null;

  const sessions = store.getUserSessions(input.userId);
  const weakAreas = detectWeakAreas(sessions);
  const newUnderstanding = updateUnderstandingScore(twin.understandingScore, input.sessionScore);

  // Determine difficulty change
  let newDifficulty = twin.currentDifficulty;
  if (input.sessionScore >= DIFFICULTY_PROGRESSION.PROMOTE_SCORE) {
    newDifficulty = shiftDifficulty(twin.currentDifficulty, +1);
  } else if (input.sessionScore <= DIFFICULTY_PROGRESSION.DEMOTE_SCORE) {
    newDifficulty = shiftDifficulty(twin.currentDifficulty, -1);
  }

  const newFormat = recommendFormat(
    newUnderstanding,
    input.cognitiveLoadScore,
    input.audioLearningEnabled ?? user.accessibility.audioLearning
  );
  const newStyle = recommendStyle(newUnderstanding, weakAreas);

  // Record adaptation if something changed
  const adaptations: TwinAdaptation[] = [...twin.adaptationHistory];
  if (newDifficulty !== twin.currentDifficulty || newFormat !== twin.recommendedFormat) {
    adaptations.push({
      timestamp: new Date().toISOString(),
      trigger: 'performance',
      previousDifficulty: twin.currentDifficulty,
      newDifficulty,
      previousFormat: twin.recommendedFormat,
      newFormat,
      reason: `Score ${input.sessionScore}% → difficulty ${twin.currentDifficulty} → ${newDifficulty}`,
    });
  }

  return store.updateTwin(input.userId, {
    currentDifficulty: newDifficulty,
    predictedWeakAreas: weakAreas,
    understandingScore: newUnderstanding,
    cognitiveLoadScore: input.cognitiveLoadScore,
    recommendedFormat: newFormat,
    recommendedStyle: newStyle,
    adaptationHistory: adaptations.slice(-50), // keep last 50
  });
}

// ── Predict learning difficulties ────────────────────────────

export interface LearningPrediction {
  riskLevel: 'low' | 'medium' | 'high';
  predictedWeakAreas: string[];
  recommendedInterventions: string[];
  confidenceScore: number;
}

export function predictLearningDifficulties(userId: string): LearningPrediction {
  const twin = store.getTwin(userId);
  const sessions = store.getUserSessions(userId);

  if (!twin) {
    return {
      riskLevel: 'low',
      predictedWeakAreas: [],
      recommendedInterventions: [],
      confidenceScore: 0,
    };
  }

  const recentSessions = sessions.slice(-5);
  const avgScore = recentSessions.length > 0
    ? recentSessions.reduce((a, s) => a + s.performanceScore, 0) / recentSessions.length
    : 50;

  const trend = recentSessions.length >= 2
    ? recentSessions[recentSessions.length - 1].performanceScore -
      recentSessions[0].performanceScore
    : 0;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (avgScore < 40 || trend < -15) riskLevel = 'high';
  else if (avgScore < 60 || trend < -5) riskLevel = 'medium';

  const interventions: string[] = [];
  if (riskLevel === 'high') {
    interventions.push('Switch to simplified content format');
    interventions.push('Reduce session duration to 15 minutes');
    interventions.push('Enable visual diagrams for all topics');
  } else if (riskLevel === 'medium') {
    interventions.push('Add more examples to explanations');
    interventions.push('Review weak areas with step-by-step guides');
  }

  if (twin.cognitiveLoadScore > COGNITIVE_LOAD.OVERLOAD_THRESHOLD) {
    interventions.push('Schedule a break — cognitive load is high');
  }

  return {
    riskLevel,
    predictedWeakAreas: twin.predictedWeakAreas,
    recommendedInterventions: interventions,
    confidenceScore: Math.min(100, recentSessions.length * 20),
  };
}
