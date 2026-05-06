// ============================================================
// SARVYA Shared Constants
// ============================================================

export const DIFFICULTY_LEVELS = ['very-easy', 'easy', 'medium', 'hard', 'very-hard'] as const;

export const CONTENT_FORMATS = ['text', 'audio', 'visual', 'interactive', 'simplified'] as const;

export const EXPLANATION_STYLES = ['story', 'step-by-step', 'diagram', 'example'] as const;

export const COGNITIVE_STATES = ['focused', 'distracted', 'overloaded', 'low-engagement', 'optimal'] as const;

// Cognitive load thresholds
export const COGNITIVE_LOAD = {
  OPTIMAL_MAX: 60,
  OVERLOAD_THRESHOLD: 80,
  LOW_ENGAGEMENT_THRESHOLD: 20,
  DISTRACTION_RESPONSE_TIME_MS: 8000,
  MAX_SESSION_MINUTES: 45,
  BREAK_TRIGGER_MINUTES: 25,
} as const;

// Hardware sensor thresholds
export const SENSOR_THRESHOLDS = {
  LOW_LIGHT_LUX: 100,          // below this → switch to audio
  HIGH_MOVEMENT_INTENSITY: 0.7, // above this → reduce cognitive load
  HIGH_INTERACTION_PER_MIN: 30, // above this → increase engagement
  LOW_INTERACTION_PER_MIN: 2,   // below this → check engagement
} as const;

// Accessibility font sizes
export const FONT_SIZES = {
  SMALL: 12,
  NORMAL: 16,
  LARGE: 20,
  EXTRA_LARGE: 24,
  HUGE: 32,
} as const;

// API endpoints (used by all platforms)
export const API_ENDPOINTS = {
  BASE: '/api/v1',
  TWIN: '/api/v1/twin',
  ACCESSIBILITY: '/api/v1/accessibility',
  TRANSFORM: '/api/v1/transform',
  COMPANION: '/api/v1/companion',
  COGNITIVE: '/api/v1/cognitive',
  HARDWARE: '/api/v1/hardware',
  SYNC: '/api/v1/sync',
  SESSIONS: '/api/v1/sessions',
  USERS: '/api/v1/users',
} as const;

// WebSocket events
export const WS_EVENTS = {
  TWIN_UPDATE: 'twin:update',
  COGNITIVE_ALERT: 'cognitive:alert',
  HARDWARE_DATA: 'hardware:data',
  ACCESSIBILITY_CHANGE: 'accessibility:change',
  COMPANION_MESSAGE: 'companion:message',
  SYNC_REQUEST: 'sync:request',
  SYNC_COMPLETE: 'sync:complete',
} as const;

// Default accessibility preferences
export const DEFAULT_ACCESSIBILITY = {
  mode: 'standard' as const,
  highContrast: false,
  largeText: false,
  voiceNavigation: false,
  screenReaderOptimized: false,
  reducedMotion: false,
  fontSize: 16,
  preferredExplanationStyle: 'step-by-step' as const,
  communicationStyle: 'intermediate' as const,
  audioLearning: false,
  simplifiedText: false,
};

// Difficulty progression rules
export const DIFFICULTY_PROGRESSION = {
  PROMOTE_SCORE: 80,   // score above this → increase difficulty
  DEMOTE_SCORE: 40,    // score below this → decrease difficulty
  SESSIONS_BEFORE_CHANGE: 2, // consecutive sessions needed before change
} as const;
