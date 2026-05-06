'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccessibilityMode   = 'standard' | 'high-contrast' | 'large-text' | 'voice-first' | 'simplified';
export type ExplanationStyle    = 'story' | 'step-by-step' | 'diagram' | 'example';
export type CommunicationStyle  = 'beginner' | 'intermediate' | 'advanced';
export type ActivePage          =
  | 'dashboard' | 'twin' | 'companion' | 'transform'
  | 'cognitive' | 'hardware' | 'accessibility' | 'game'
  | 'learning-map' | 'session-replay' | 'career-os' | 'access-page';

export interface AccessibilityPrefs {
  mode: AccessibilityMode;
  highContrast: boolean;
  largeText: boolean;
  voiceNavigation: boolean;
  screenReaderOptimized: boolean;
  reducedMotion: boolean;
  fontSize: number;
  preferredExplanationStyle: ExplanationStyle;
  communicationStyle: CommunicationStyle;
  audioLearning: boolean;
  simplifiedText: boolean;
}

interface SarvyaState {
  userId: string;
  userName: string;
  language: string;
  activePage: ActivePage;
  sidebarOpen: boolean;
  accessibility: AccessibilityPrefs;
  twin: any | null;
  prediction: any | null;
  cognitiveLoad: any | null;
  latestSensor: any | null;
  companionSessionKey: string;
  companionMessages: any[];
  mqttConnected: boolean;
  realtimeConnected: boolean;

  setUserId:            (id: string, name?: string) => void;
  setLanguage:          (lang: string) => void;
  setActivePage:        (page: ActivePage) => void;
  toggleSidebar:        () => void;
  setAccessibility:     (prefs: Partial<AccessibilityPrefs>) => void;
  setTwin:              (twin: any) => void;
  setPrediction:        (p: any) => void;
  setCognitiveLoad:     (c: any) => void;
  setLatestSensor:      (s: any) => void;
  setCompanionKey:      (key: string) => void;
  addCompanionMessage:  (msg: any) => void;
  clearCompanion:       () => void;
  setMqttConnected:     (v: boolean) => void;
  setRealtimeConnected: (v: boolean) => void;
}

const DEFAULT_A11Y: AccessibilityPrefs = {
  mode: 'standard', highContrast: false, largeText: false,
  voiceNavigation: false, screenReaderOptimized: false, reducedMotion: false,
  fontSize: 16, preferredExplanationStyle: 'step-by-step',
  communicationStyle: 'intermediate', audioLearning: false, simplifiedText: false,
};

export const useSarvyaStore = create<SarvyaState>()(
  persist(
    (set) => ({
      userId: '',
      userName: 'Learner',
      language: 'en',
      activePage: 'dashboard',
      sidebarOpen: true,
      accessibility: DEFAULT_A11Y,
      twin: null,
      prediction: null,
      cognitiveLoad: null,
      latestSensor: null,
      companionSessionKey: `session-${Date.now()}`,
      companionMessages: [],
      mqttConnected: false,
      realtimeConnected: false,

      setUserId:            (id, name) => set({ userId: id, userName: name || 'Learner' }),
      setLanguage:          (lang)     => set({ language: lang }),
      setActivePage:        (page)     => set({ activePage: page }),
      toggleSidebar:        ()         => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setAccessibility:     (p)        => set((s) => ({ accessibility: { ...s.accessibility, ...p } })),
      setTwin:              (twin)     => set({ twin }),
      setPrediction:        (p)        => set({ prediction: p }),
      setCognitiveLoad:     (c)        => set({ cognitiveLoad: c }),
      setLatestSensor:      (s)        => set({ latestSensor: s }),
      setCompanionKey:      (key)      => set({ companionSessionKey: key }),
      addCompanionMessage:  (msg)      => set((s) => ({ companionMessages: [...s.companionMessages, msg] })),
      clearCompanion:       ()         => set({ companionMessages: [], companionSessionKey: `session-${Date.now()}` }),
      setMqttConnected:     (v)        => set({ mqttConnected: v }),
      setRealtimeConnected: (v)        => set({ realtimeConnected: v }),
    }),
    {
      name: 'sarvya-store-v2',
      partialize: (s) => ({
        userId: s.userId,
        userName: s.userName,
        language: s.language,
        accessibility: s.accessibility,
      }),
    }
  )
);
