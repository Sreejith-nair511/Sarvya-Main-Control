// ============================================================
// SARVYA In-Memory Store
// Simulates a database for development. Replace with a real
// DB (PostgreSQL, MongoDB, etc.) in production.
// ============================================================

import {
  UserProfile,
  LearningTwinState,
  LearningSession,
  CognitiveLoadData,
  RoverSensorData,
  CompanionSession,
} from '../../../shared/types';
import { DEFAULT_ACCESSIBILITY } from '../../../shared/constants';
import { v4 as uuidv4 } from 'uuid';

// ── In-memory collections ────────────────────────────────────
const users = new Map<string, UserProfile>();
const twins = new Map<string, LearningTwinState>();
const sessions = new Map<string, LearningSession>();
const cognitiveHistory = new Map<string, CognitiveLoadData[]>();
const sensorHistory = new Map<string, RoverSensorData[]>();
const companionSessions = new Map<string, CompanionSession>();

// ── Seed a demo user ─────────────────────────────────────────
const DEMO_USER_ID = 'demo-user-001';

const demoTwin: LearningTwinState = {
  userId: DEMO_USER_ID,
  currentDifficulty: 'medium',
  predictedWeakAreas: ['fractions', 'algebra'],
  understandingScore: 65,
  engagementScore: 72,
  cognitiveLoadScore: 45,
  recommendedFormat: 'visual',
  recommendedStyle: 'step-by-step',
  adaptationHistory: [],
  lastUpdated: new Date().toISOString(),
};

const demoUser: UserProfile = {
  id: DEMO_USER_ID,
  name: 'Demo Learner',
  age: 12,
  accessibility: { ...DEFAULT_ACCESSIBILITY },
  learningHistory: [],
  twinState: demoTwin,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

users.set(DEMO_USER_ID, demoUser);
twins.set(DEMO_USER_ID, demoTwin);

// ── Store API ────────────────────────────────────────────────

export const store = {
  // Users
  getUser: (id: string) => users.get(id),
  getAllUsers: () => Array.from(users.values()),
  createUser: (data: Partial<UserProfile>): UserProfile => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const twin: LearningTwinState = {
      userId: id,
      currentDifficulty: 'medium',
      predictedWeakAreas: [],
      understandingScore: 50,
      engagementScore: 50,
      cognitiveLoadScore: 30,
      recommendedFormat: 'text',
      recommendedStyle: 'step-by-step',
      adaptationHistory: [],
      lastUpdated: now,
    };
    const user: UserProfile = {
      id,
      name: data.name || 'New Learner',
      age: data.age,
      accessibility: data.accessibility || { ...DEFAULT_ACCESSIBILITY },
      learningHistory: [],
      twinState: twin,
      createdAt: now,
      updatedAt: now,
    };
    users.set(id, user);
    twins.set(id, twin);
    return user;
  },
  updateUser: (id: string, updates: Partial<UserProfile>): UserProfile | null => {
    const user = users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    users.set(id, updated);
    return updated;
  },

  // Twins
  getTwin: (userId: string) => twins.get(userId),
  updateTwin: (userId: string, updates: Partial<LearningTwinState>): LearningTwinState | null => {
    const twin = twins.get(userId);
    if (!twin) return null;
    const updated = { ...twin, ...updates, lastUpdated: new Date().toISOString() };
    twins.set(userId, updated);
    // Also update user's twinState
    const user = users.get(userId);
    if (user) users.set(userId, { ...user, twinState: updated });
    return updated;
  },

  // Sessions
  getSession: (id: string) => sessions.get(id),
  getUserSessions: (userId: string) =>
    Array.from(sessions.values()).filter(s => s.userId === userId),
  createSession: (data: Partial<LearningSession>): LearningSession => {
    const id = uuidv4();
    const session: LearningSession = {
      id,
      userId: data.userId || '',
      startTime: new Date().toISOString(),
      subject: data.subject || 'General',
      topicsAttempted: data.topicsAttempted || [],
      performanceScore: 0,
      completionRate: 0,
      adaptationsApplied: [],
      cognitiveLoadEvents: [],
      accessibilityFeaturesUsed: [],
      platform: data.platform || 'web',
    };
    sessions.set(id, session);
    return session;
  },
  updateSession: (id: string, updates: Partial<LearningSession>): LearningSession | null => {
    const session = sessions.get(id);
    if (!session) return null;
    const updated = { ...session, ...updates };
    sessions.set(id, updated);
    return updated;
  },

  // Cognitive history
  getCognitiveHistory: (userId: string) => cognitiveHistory.get(userId) || [],
  addCognitiveEvent: (userId: string, event: CognitiveLoadData) => {
    const history = cognitiveHistory.get(userId) || [];
    history.push(event);
    // Keep last 100 events
    if (history.length > 100) history.shift();
    cognitiveHistory.set(userId, history);
  },

  // Sensor history
  getSensorHistory: (deviceId: string) => sensorHistory.get(deviceId) || [],
  addSensorData: (data: RoverSensorData) => {
    const history = sensorHistory.get(data.deviceId) || [];
    history.push(data);
    if (history.length > 200) history.shift();
    sensorHistory.set(data.deviceId, history);
  },
  getLatestSensorData: (deviceId: string): RoverSensorData | null => {
    const history = sensorHistory.get(deviceId) || [];
    return history.length > 0 ? history[history.length - 1] : null;
  },

  // Companion sessions
  getCompanionSession: (sessionId: string) => companionSessions.get(sessionId),
  createCompanionSession: (userId: string): CompanionSession => {
    const sessionId = uuidv4();
    const session: CompanionSession = {
      sessionId,
      userId,
      messages: [],
      currentStyle: 'intermediate',
      voiceEnabled: false,
    };
    companionSessions.set(sessionId, session);
    return session;
  },
  updateCompanionSession: (sessionId: string, updates: Partial<CompanionSession>) => {
    const session = companionSessions.get(sessionId);
    if (!session) return null;
    const updated = { ...session, ...updates };
    companionSessions.set(sessionId, updated);
    return updated;
  },
};
