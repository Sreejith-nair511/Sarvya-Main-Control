// ============================================================
// SARVYA Shared Types
// Used across backend, web, mobile, and game modules
// ============================================================

// ── User & Profile ──────────────────────────────────────────

export type AccessibilityMode = 'standard' | 'high-contrast' | 'large-text' | 'voice-first' | 'simplified';

export type ExplanationStyle = 'story' | 'step-by-step' | 'diagram' | 'example';

export type CommunicationStyle = 'beginner' | 'intermediate' | 'advanced';

export interface AccessibilityPreferences {
  mode: AccessibilityMode;
  highContrast: boolean;
  largeText: boolean;
  voiceNavigation: boolean;
  screenReaderOptimized: boolean;
  reducedMotion: boolean;
  fontSize: number; // 12–32px
  preferredExplanationStyle: ExplanationStyle;
  communicationStyle: CommunicationStyle;
  audioLearning: boolean;
  simplifiedText: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  accessibility: AccessibilityPreferences;
  learningHistory: LearningSession[];
  twinState: LearningTwinState;
  createdAt: string;
  updatedAt: string;
}

// ── Learning Twin ────────────────────────────────────────────

export type DifficultyLevel = 'very-easy' | 'easy' | 'medium' | 'hard' | 'very-hard';

export type ContentFormat = 'text' | 'audio' | 'visual' | 'interactive' | 'simplified';

export interface LearningTwinState {
  userId: string;
  currentDifficulty: DifficultyLevel;
  predictedWeakAreas: string[];
  understandingScore: number; // 0–100
  engagementScore: number;    // 0–100
  cognitiveLoadScore: number; // 0–100 (higher = more load)
  recommendedFormat: ContentFormat;
  recommendedStyle: ExplanationStyle;
  adaptationHistory: TwinAdaptation[];
  lastUpdated: string;
}

export interface TwinAdaptation {
  timestamp: string;
  trigger: 'performance' | 'sensor' | 'user-request' | 'time';
  previousDifficulty: DifficultyLevel;
  newDifficulty: DifficultyLevel;
  previousFormat: ContentFormat;
  newFormat: ContentFormat;
  reason: string;
}

// ── Cognitive Load ───────────────────────────────────────────

export type CognitiveState = 'focused' | 'distracted' | 'overloaded' | 'low-engagement' | 'optimal';

export interface CognitiveLoadData {
  userId: string;
  timestamp: string;
  state: CognitiveState;
  score: number; // 0–100
  indicators: {
    responseTime: number;    // ms
    errorRate: number;       // 0–1
    sessionDuration: number; // minutes
    lightLevel?: number;     // lux from rover
    movementLevel?: number;  // 0–1 from rover
    interactionRate?: number;// clicks/min
  };
  recommendation: CognitiveAdaptation;
}

export interface CognitiveAdaptation {
  action: 'reduce-difficulty' | 'shorten-session' | 'change-format' | 'take-break' | 'increase-engagement' | 'none';
  reason: string;
  newDifficulty?: DifficultyLevel;
  newFormat?: ContentFormat;
  breakDurationMinutes?: number;
}

// ── Hardware / Rover ─────────────────────────────────────────

export interface RoverSensorData {
  deviceId: string;
  timestamp: string;
  lightLevel: number;       // lux
  movementIntensity: number;// 0–1
  temperature?: number;     // celsius
  proximity?: number;       // cm
  interactionCount: number; // button presses / interactions
  batteryLevel: number;     // 0–100
}

export interface HardwareAccessibilityDecision {
  trigger: 'low-light' | 'high-movement' | 'high-interaction' | 'low-interaction';
  action: string;
  contentFormatOverride?: ContentFormat;
  difficultyOverride?: DifficultyLevel;
  notifyUser: boolean;
  message: string;
}

// ── Content & Accessibility Transformer ─────────────────────

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  subject: string;
  difficulty: DifficultyLevel;
  format: ContentFormat;
  tags: string[];
}

export interface TransformedContent {
  original: ContentItem;
  audio?: AudioContent;
  simplified?: SimplifiedContent;
  visual?: VisualContent;
  storyFormat?: string;
  stepByStep?: string[];
  examples?: string[];
}

export interface AudioContent {
  text: string;           // SSML or plain text for TTS
  durationEstimate: number; // seconds
  voiceStyle: 'calm' | 'energetic' | 'slow';
}

export interface SimplifiedContent {
  text: string;
  readingLevel: 'grade-3' | 'grade-5' | 'grade-8';
  keyPoints: string[];
}

export interface VisualContent {
  diagramType: 'flowchart' | 'mindmap' | 'timeline' | 'comparison';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface DiagramNode {
  id: string;
  label: string;
  type: 'concept' | 'step' | 'example' | 'result';
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

// ── Learning Session ─────────────────────────────────────────

export interface LearningSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  subject: string;
  topicsAttempted: string[];
  performanceScore: number; // 0–100
  completionRate: number;   // 0–1
  adaptationsApplied: TwinAdaptation[];
  cognitiveLoadEvents: CognitiveLoadData[];
  accessibilityFeaturesUsed: string[];
  platform: 'web' | 'mobile' | 'game';
}

// ── Conversational Companion ─────────────────────────────────

export interface CompanionMessage {
  id: string;
  role: 'user' | 'companion';
  content: string;
  timestamp: string;
  format: 'text' | 'audio' | 'simplified';
  style: ExplanationStyle;
}

export interface CompanionSession {
  sessionId: string;
  userId: string;
  messages: CompanionMessage[];
  currentStyle: CommunicationStyle;
  voiceEnabled: boolean;
  topic?: string;
}

// ── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface SyncPayload {
  userId: string;
  twinState: LearningTwinState;
  accessibilityPrefs: AccessibilityPreferences;
  lastSession?: LearningSession;
  cognitiveLoad?: CognitiveLoadData;
  platform: 'web' | 'mobile' | 'game';
  syncedAt: string;
}
