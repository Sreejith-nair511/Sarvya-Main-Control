// ── SARVYA API client — calls Next.js /api routes ────────────
// No separate backend needed. All routes live in src/app/api/

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json as T;
}

export const api = {
  twin: {
    get:     (userId: string)          => request<any>(`/api/twin?userId=${userId}`),
    update:  (userId: string, b: any)  => request<any>('/api/twin', { method: 'POST', body: JSON.stringify({ userId, ...b }) }),
    predict: (userId: string)          => request<any>(`/api/twin/predict?userId=${userId}`),
  },
  accessibility: {
    get:    (userId: string)           => request<any>(`/api/accessibility?userId=${userId}`),
    update: (userId: string, b: any)   => request<any>('/api/accessibility', { method: 'PUT', body: JSON.stringify({ userId, ...b }) }),
    reset:  (userId: string)           => request<any>('/api/accessibility', { method: 'PUT', body: JSON.stringify({ userId, mode: 'standard', highContrast: false, largeText: false, voiceNavigation: false, screenReaderOptimized: false, reducedMotion: false, fontSize: 16, preferredExplanationStyle: 'step-by-step', communicationStyle: 'intermediate', audioLearning: false, simplifiedText: false }) }),
  },
  companion: {
    chat: (b: any)                     => request<any>('/api/companion', { method: 'POST', body: JSON.stringify(b) }),
    history: (userId: string, key: string) => request<any>(`/api/companion?userId=${userId}&sessionKey=${key}`),
  },
  cognitive: {
    evaluate: (b: any)                 => request<any>('/api/cognitive', { method: 'POST', body: JSON.stringify(b) }),
    trend:    (userId: string)         => request<any>(`/api/cognitive?userId=${userId}`),
    history:  (userId: string)         => request<any>(`/api/cognitive?userId=${userId}&history=1`),
  },
  hardware: {
    send:    (b: any)                  => request<any>('/api/hardware', { method: 'POST', body: JSON.stringify(b) }),
    sendRover: (b: any)                => request<any>('/api/hardware', { method: 'POST', body: JSON.stringify(b) }),
    summary: (userId: string)          => request<any>(`/api/hardware?userId=${userId}`),
  },
  sessions: {
    create:  (b: any)                  => request<any>('/api/sessions', { method: 'POST', body: JSON.stringify(b) }),
    update:  (id: string, b: any)      => request<any>('/api/sessions', { method: 'PUT', body: JSON.stringify({ id, ...b }) }),
    forUser: (userId: string)          => request<any>(`/api/sessions?userId=${userId}`),
  },
  transform: {
    all: (b: any)                      => request<any>('/api/transform', { method: 'POST', body: JSON.stringify(b) }),
  },
};
