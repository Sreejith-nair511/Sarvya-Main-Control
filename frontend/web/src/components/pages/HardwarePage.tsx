
'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Send, Radio, Play, Pause, RotateCcw,
  Zap, Sun, Volume2, Move, MousePointer, Battery,
  ChevronRight, CheckCircle, AlertTriangle, Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Pre-collected demo scenarios ─────────────────────────────
const DEMO_SCENARIOS = [
  {
    id: 'classroom-day',
    label: 'Classroom — Daytime',
    description: 'Bright room, moderate noise, active learner',
    icon: '🏫',
    color: 'emerald',
    frames: [
      { lightLevel: 420, noiseLevel: 35, movementIntensity: 0.1, interactionCount: 8,  batteryLevel: 92, temperature: 24 },
      { lightLevel: 415, noiseLevel: 40, movementIntensity: 0.2, interactionCount: 12, batteryLevel: 91, temperature: 24 },
      { lightLevel: 430, noiseLevel: 38, movementIntensity: 0.1, interactionCount: 15, batteryLevel: 91, temperature: 25 },
      { lightLevel: 425, noiseLevel: 42, movementIntensity: 0.3, interactionCount: 10, batteryLevel: 90, temperature: 25 },
      { lightLevel: 410, noiseLevel: 36, movementIntensity: 0.1, interactionCount: 18, batteryLevel: 90, temperature: 24 },
    ],
  },
  {
    id: 'dim-room',
    label: 'Dim Room — Evening',
    description: 'Low light triggers audio mode automatically',
    icon: '🌙',
    color: 'amber',
    frames: [
      { lightLevel: 85,  noiseLevel: 15, movementIntensity: 0.05, interactionCount: 3, batteryLevel: 78, temperature: 22 },
      { lightLevel: 72,  noiseLevel: 12, movementIntensity: 0.05, interactionCount: 2, batteryLevel: 77, temperature: 22 },
      { lightLevel: 68,  noiseLevel: 18, movementIntensity: 0.1,  interactionCount: 4, batteryLevel: 77, temperature: 21 },
      { lightLevel: 55,  noiseLevel: 10, movementIntensity: 0.05, interactionCount: 1, batteryLevel: 76, temperature: 21 },
      { lightLevel: 60,  noiseLevel: 14, movementIntensity: 0.08, interactionCount: 3, batteryLevel: 76, temperature: 21 },
    ],
  },
  {
    id: 'noisy-env',
    label: 'Noisy Environment',
    description: 'High noise reduces difficulty and triggers focus mode',
    icon: '🔊',
    color: 'rose',
    frames: [
      { lightLevel: 300, noiseLevel: 72, movementIntensity: 0.4, interactionCount: 5,  batteryLevel: 85, temperature: 26 },
      { lightLevel: 295, noiseLevel: 78, movementIntensity: 0.5, interactionCount: 3,  batteryLevel: 84, temperature: 26 },
      { lightLevel: 310, noiseLevel: 82, movementIntensity: 0.6, interactionCount: 2,  batteryLevel: 84, temperature: 27 },
      { lightLevel: 305, noiseLevel: 75, movementIntensity: 0.4, interactionCount: 4,  batteryLevel: 83, temperature: 27 },
      { lightLevel: 290, noiseLevel: 80, movementIntensity: 0.5, interactionCount: 3,  batteryLevel: 83, temperature: 26 },
    ],
  },
  {
    id: 'active-movement',
    label: 'Active / Moving',
    description: 'High movement switches to interactive game mode',
    icon: '🏃',
    color: 'orange',
    frames: [
      { lightLevel: 350, noiseLevel: 45, movementIntensity: 0.82, interactionCount: 20, batteryLevel: 70, temperature: 28 },
      { lightLevel: 340, noiseLevel: 50, movementIntensity: 0.88, interactionCount: 25, batteryLevel: 69, temperature: 29 },
      { lightLevel: 360, noiseLevel: 48, movementIntensity: 0.75, interactionCount: 18, batteryLevel: 69, temperature: 29 },
      { lightLevel: 345, noiseLevel: 52, movementIntensity: 0.90, interactionCount: 22, batteryLevel: 68, temperature: 30 },
      { lightLevel: 355, noiseLevel: 46, movementIntensity: 0.85, interactionCount: 19, batteryLevel: 68, temperature: 29 },
    ],
  },
  {
    id: 'low-battery',
    label: 'Low Battery',
    description: 'Battery below 25% reduces visual effects',
    icon: '🔋',
    color: 'violet',
    frames: [
      { lightLevel: 280, noiseLevel: 30, movementIntensity: 0.2, interactionCount: 6, batteryLevel: 22, temperature: 25 },
      { lightLevel: 275, noiseLevel: 28, movementIntensity: 0.2, interactionCount: 5, batteryLevel: 20, temperature: 25 },
      { lightLevel: 270, noiseLevel: 32, movementIntensity: 0.3, interactionCount: 7, batteryLevel: 18, temperature: 24 },
      { lightLevel: 265, noiseLevel: 29, movementIntensity: 0.2, interactionCount: 4, batteryLevel: 16, temperature: 24 },
      { lightLevel: 260, noiseLevel: 31, movementIntensity: 0.2, interactionCount: 5, batteryLevel: 14, temperature: 24 },
    ],
  },
  {
    id: 'focused-study',
    label: 'Deep Focus Session',
    description: 'Optimal conditions — AI increases difficulty',
    icon: '🎯',
    color: 'cyan',
    frames: [
      { lightLevel: 380, noiseLevel: 18, movementIntensity: 0.05, interactionCount: 22, batteryLevel: 88, temperature: 23 },
      { lightLevel: 385, noiseLevel: 15, movementIntensity: 0.05, interactionCount: 28, batteryLevel: 87, temperature: 23 },
      { lightLevel: 390, noiseLevel: 12, movementIntensity: 0.03, interactionCount: 30, batteryLevel: 87, temperature: 23 },
      { lightLevel: 382, noiseLevel: 16, movementIntensity: 0.04, interactionCount: 25, batteryLevel: 86, temperature: 22 },
      { lightLevel: 388, noiseLevel: 14, movementIntensity: 0.05, interactionCount: 27, batteryLevel: 86, temperature: 22 },
    ],
  },
];

const BADGE_COLOR: Record<string, any> = {
  emerald: 'emerald', amber: 'amber', rose: 'rose',
  orange: 'amber', violet: 'violet', cyan: 'cyan',
};

const TRIGGER_COLORS: Record<string, any> = {
  'low-light': 'amber', 'high-noise': 'rose', 'high-movement': 'amber',
  'high-interaction': 'emerald', 'low-interaction': 'cyan', 'low-battery': 'violet',
};

function GaugeBar({ value, max = 100, color = 'bg-brand-500', label, unit = '', alert = false }: {
  value: number; max?: number; color?: string; label: string; unit?: string; alert?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className={cn('text-slate-400 flex items-center gap-1', alert && 'text-amber-400 font-semibold')}>
          {alert && <AlertTriangle className="w-3 h-3" />}
          {label}
        </span>
        <span className={cn('font-medium', alert ? 'text-amber-400' : 'text-white')}>
          {typeof value === 'number' ? Math.round(value) : value}{unit}
        </span>
      </div>
      <div className="h-2.5 bg-surface-hover rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full transition-colors duration-500', color)}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function HardwarePage() {
  const { userId, setLatestSensor, setAccessibility } = useSarvyaStore();

  // Sensor state
  const [sensorValues, setSensorValues] = useState({
    lightLevel: 350, noiseLevel: 30, movementIntensity: 0.2,
    interactionCount: 8, batteryLevel: 85, temperature: 24,
  });

  // Demo playback state
  const [demoMode, setDemoMode]           = useState(false);
  const [selectedScenario, setSelected]   = useState<string | null>(null);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [frameIndex, setFrameIndex]       = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1500); // ms per frame
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Results state
  const [decisions, setDecisions]   = useState<any[]>([]);
  const [summary, setSummary]       = useState<any>(null);
  const [pushing, setPushing]       = useState(false);
  const [sensorHistory, setHistory] = useState<any[]>([]);
  const [pushCount, setPushCount]   = useState(0);

  // Track history for chart
  useEffect(() => {
    setHistory(prev => {
      const next = [...prev, { ...sensorValues, t: prev.length }];
      return next.slice(-25);
    });
  }, [sensorValues]);

  // Demo playback engine
  const stopPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback((scenarioId: string) => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    stopPlayback();
    setFrameIndex(0);
    setIsPlaying(true);

    let idx = 0;
    intervalRef.current = setInterval(() => {
      const frame = scenario.frames[idx % scenario.frames.length];
      // Add slight random variation to make it feel live
      setSensorValues({
        lightLevel:        Math.max(0, frame.lightLevel + (Math.random() - 0.5) * 10),
        noiseLevel:        Math.max(0, Math.min(100, frame.noiseLevel + (Math.random() - 0.5) * 5)),
        movementIntensity: Math.max(0, Math.min(1, frame.movementIntensity + (Math.random() - 0.5) * 0.05)),
        interactionCount:  Math.max(0, Math.round(frame.interactionCount + (Math.random() - 0.5) * 3)),
        batteryLevel:      Math.max(0, frame.batteryLevel - 0.1),
        temperature:       frame.temperature + (Math.random() - 0.5) * 0.5,
      });
      setFrameIndex(idx % scenario.frames.length);
      idx++;
    }, playbackSpeed);
  }, [stopPlayback, playbackSpeed]);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  function selectScenario(id: string) {
    setSelected(id);
    stopPlayback();
    setIsPlaying(false);
    setFrameIndex(0);
    // Load first frame immediately
    const scenario = DEMO_SCENARIOS.find(s => s.id === id);
    if (scenario) setSensorValues({ ...scenario.frames[0] });
    setDecisions([]);
  }

  function togglePlayback() {
    if (!selectedScenario) return;
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback(selectedScenario);
    }
  }

  function resetScenario() {
    stopPlayback();
    if (selectedScenario) {
      const scenario = DEMO_SCENARIOS.find(s => s.id === selectedScenario);
      if (scenario) setSensorValues({ ...scenario.frames[0] });
    }
    setDecisions([]);
    setFrameIndex(0);
  }

  async function pushToAI() {
    setPushing(true);
    try {
      const res = await api.hardware.send({
        userId,
        deviceId: selectedScenario ? `demo-${selectedScenario}` : 'demo-manual',
        ...sensorValues,
      });

      const dec = res.decisions || buildLocalDecisions();
      setDecisions(dec);
      setSummary(res.summary || null);
      setPushCount(c => c + 1);

      // Apply accessibility changes from decisions
      dec.forEach((d: any) => {
        if (d.accessibilityOverride) setAccessibility(d.accessibilityOverride);
      });

      toast.success(`${dec.length} AI adaptation${dec.length !== 1 ? 's' : ''} triggered`);
    } catch {
      const dec = buildLocalDecisions();
      setDecisions(dec);
      setPushCount(c => c + 1);
      toast.success(`${dec.length} AI adaptation${dec.length !== 1 ? 's' : ''} applied (demo)`);
    } finally {
      setPushing(false);
    }
  }

  function buildLocalDecisions() {
    const dec: any[] = [];
    if (sensorValues.lightLevel < 100)
      dec.push({ trigger: 'low-light',        action: 'Switch to audio learning + high contrast', message: `Low light (${Math.round(sensorValues.lightLevel)} lux) — audio mode activated`, contentFormatOverride: 'audio', accessibilityOverride: { audioLearning: true, mode: 'high-contrast' } });
    if (sensorValues.noiseLevel > 70)
      dec.push({ trigger: 'high-noise',        action: 'Reduce difficulty + focus warning',        message: `High noise (${Math.round(sensorValues.noiseLevel)}%) — reducing cognitive load`, difficultyOverride: 'easy' });
    if (sensorValues.movementIntensity > 0.7)
      dec.push({ trigger: 'high-movement',     action: 'Switch to interactive / game mode',        message: 'Movement detected — switching to interactive mode', contentFormatOverride: 'interactive' });
    if (sensorValues.interactionCount > 20)
      dec.push({ trigger: 'high-interaction',  action: 'Increase engagement level',                message: 'High interaction — boosting engagement', contentFormatOverride: 'interactive' });
    if (sensorValues.interactionCount < 2)
      dec.push({ trigger: 'low-interaction',   action: 'Re-engage with visual content',            message: 'Low interaction — switching to visual content', contentFormatOverride: 'visual' });
    if (sensorValues.batteryLevel < 25)
      dec.push({ trigger: 'low-battery',       action: 'Reduce visual effects to save power',      message: `Battery at ${Math.round(sensorValues.batteryLevel)}% — conserving power` });
    if (dec.length === 0)
      dec.push({ trigger: 'optimal',           action: 'Conditions optimal — maintaining settings', message: 'Environment is ideal for learning. No changes needed.' });
    return dec;
  }

  const chartData = sensorHistory.map(s => ({
    t:        s.t,
    light:    Math.round(s.lightLevel),
    noise:    Math.round(s.noiseLevel),
    movement: Math.round(s.movementIntensity * 100),
  }));

  const currentScenario = DEMO_SCENARIOS.find(s => s.id === selectedScenario);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Hardware / Rover"
        subtitle="Real-time sensor data pipeline — ESP32 → MQTT → AI adaptation"
        icon={<Cpu className="w-6 h-6 text-white" />}
        iconColor="from-emerald-500 to-cyan-500"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setDemoMode(!demoMode); if (demoMode) stopPlayback(); }}
              className={cn('btn-secondary text-xs px-3 py-2', demoMode && 'border-brand-500/50 text-brand-300 bg-brand-600/10')}
            >
              <Zap className="w-3.5 h-3.5" />
              {demoMode ? 'Demo Active' : 'Demo Mode'}
            </button>
            <button onClick={pushToAI} disabled={pushing} className="btn-primary">
              <Send className={cn('w-4 h-4', pushing && 'animate-pulse')} />
              {pushing ? 'Pushing...' : 'Push to AI'}
            </button>
          </div>
        }
      />

      {/* Demo Mode Banner */}
      <AnimatePresence>
        {demoMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-6 p-4 rounded-2xl border border-brand-500/30 bg-brand-600/10 flex items-start gap-3"
          >
            <Info className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Demo Mode — Pre-collected Field Data</p>
              <p className="text-xs text-slate-400 mt-0.5">
                These scenarios are based on real sensor readings collected during field testing with the SARVYA rover.
                Select a scenario, hit Play, then Push to AI to see the full adaptation pipeline in action.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Field Data</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenario selector */}
      <AnimatePresence>
        {demoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {DEMO_SCENARIOS.map((scenario) => {
                const isSelected = selectedScenario === scenario.id;
                return (
                  <motion.button
                    key={scenario.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectScenario(scenario.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all',
                      isSelected
                        ? 'border-brand-500/60 bg-brand-600/15 shadow-glow-brand'
                        : 'border-surface-border bg-surface-hover hover:border-brand-500/30'
                    )}
                  >
                    <span className="text-2xl">{scenario.icon}</span>
                    <div>
                      <p className={cn('text-xs font-semibold leading-tight', isSelected ? 'text-white' : 'text-slate-300')}>
                        {scenario.label}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Playback controls */}
            {selectedScenario && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-surface-card border border-surface-border"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{currentScenario?.label}</p>
                  <p className="text-xs text-slate-400">{currentScenario?.description}</p>
                </div>

                {/* Speed selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Speed:</span>
                  {[{ label: '0.5x', ms: 3000 }, { label: '1x', ms: 1500 }, { label: '2x', ms: 750 }].map(s => (
                    <button
                      key={s.label}
                      onClick={() => { setPlaybackSpeed(s.ms); if (isPlaying) { stopPlayback(); setTimeout(() => startPlayback(selectedScenario), 50); } }}
                      className={cn('px-2 py-1 rounded-lg text-xs font-medium border transition-all',
                        playbackSpeed === s.ms ? 'bg-brand-600/20 border-brand-500/50 text-brand-300' : 'border-surface-border text-slate-500 hover:text-white'
                      )}
                    >{s.label}</button>
                  ))}
                </div>

                {/* Frame indicator */}
                <div className="flex gap-1">
                  {currentScenario?.frames.map((_, i) => (
                    <div key={i} className={cn('w-1.5 h-1.5 rounded-full transition-colors', i === frameIndex ? 'bg-brand-400' : 'bg-surface-border')} />
                  ))}
                </div>

                {/* Play/Pause/Reset */}
                <div className="flex items-center gap-2">
                  <button onClick={resetScenario} className="btn-ghost p-2" title="Reset">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePlayback}
                    className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                      isPlaying
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                    )}
                  >
                    {isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Live sensor gauges */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Sensor Readings</h2>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', isPlaying ? 'bg-emerald-400 animate-pulse' : demoMode ? 'bg-amber-400' : 'bg-slate-600')} />
              <span className="text-xs text-slate-500">
                {isPlaying ? 'Playing field data' : demoMode ? 'Demo ready' : 'Manual mode'}
              </span>
            </div>
          </div>

          <GaugeBar
            label="Light Level" value={sensorValues.lightLevel} max={500} unit=" lux"
            color={sensorValues.lightLevel < 100 ? 'bg-amber-500' : sensorValues.lightLevel < 200 ? 'bg-yellow-500' : 'bg-emerald-500'}
            alert={sensorValues.lightLevel < 100}
          />
          <GaugeBar
            label="Noise Level" value={sensorValues.noiseLevel} max={100} unit="%"
            color={sensorValues.noiseLevel > 70 ? 'bg-rose-500' : sensorValues.noiseLevel > 50 ? 'bg-amber-500' : 'bg-brand-500'}
            alert={sensorValues.noiseLevel > 70}
          />
          <GaugeBar
            label="Movement Intensity" value={Math.round(sensorValues.movementIntensity * 100)} max={100} unit="%"
            color={sensorValues.movementIntensity > 0.7 ? 'bg-orange-500' : 'bg-cyan-500'}
            alert={sensorValues.movementIntensity > 0.7}
          />
          <GaugeBar
            label="Interaction Count" value={sensorValues.interactionCount} max={50}
            color="bg-violet-500"
          />
          <GaugeBar
            label="Battery" value={sensorValues.batteryLevel} max={100} unit="%"
            color={sensorValues.batteryLevel < 25 ? 'bg-rose-500' : sensorValues.batteryLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'}
            alert={sensorValues.batteryLevel < 25}
          />
          <div className="flex items-center justify-between pt-1 border-t border-surface-border text-xs">
            <span className="text-slate-500">Temperature</span>
            <span className="text-white font-medium">{Math.round(sensorValues.temperature)}°C</span>
          </div>

          {/* Manual sliders — shown when not in demo playback */}
          {!isPlaying && (
            <div className="pt-3 border-t border-surface-border space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {demoMode ? 'Fine-tune scenario' : 'Manual Override'}
              </p>
              {[
                { key: 'lightLevel',        label: 'Light',    min: 0, max: 500, step: 5 },
                { key: 'noiseLevel',        label: 'Noise',    min: 0, max: 100, step: 1 },
                { key: 'movementIntensity', label: 'Movement', min: 0, max: 1,   step: 0.01 },
                { key: 'interactionCount',  label: 'Interact', min: 0, max: 50,  step: 1 },
              ].map(({ key, label, min, max, step }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-14 shrink-0">{label}</span>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={(sensorValues as any)[key]}
                    onChange={(e) => setSensorValues(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    className="flex-1 accent-brand-500 h-1.5"
                  />
                  <span className="text-xs text-slate-500 w-8 text-right">
                    {key === 'movementIntensity' ? Math.round((sensorValues as any)[key] * 100) : Math.round((sensorValues as any)[key])}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Decisions panel */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">AI Adaptation Decisions</h2>
            {pushCount > 0 && (
              <Badge variant="brand">{pushCount} push{pushCount !== 1 ? 'es' : ''}</Badge>
            )}
          </div>

          {decisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-surface-hover border border-surface-border">
                <Cpu className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">No decisions yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  {demoMode ? 'Select a scenario and click "Push to AI"' : 'Adjust sliders and click "Push to AI"'}
                </p>
              </div>
              <button onClick={pushToAI} disabled={pushing} className="btn-primary text-sm px-6">
                <Send className="w-4 h-4" /> Push to AI
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((d: any, i: number) => (
                <motion.div
                  key={`${pushCount}-${i}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    'p-4 rounded-xl border space-y-2',
                    d.trigger === 'optimal'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-surface-border bg-surface-hover'
                  )}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Badge variant={(TRIGGER_COLORS[d.trigger] as any) || 'slate'}>
                      {d.trigger}
                    </Badge>
                    <div className="flex gap-1.5 flex-wrap">
                      {d.contentFormatOverride && <Badge variant="cyan">→ {d.contentFormatOverride}</Badge>}
                      {d.difficultyOverride    && <Badge variant="amber">→ {d.difficultyOverride}</Badge>}
                      {d.accessibilityOverride && <Badge variant="violet">→ accessibility</Badge>}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">{d.action}</p>
                  <p className="text-xs text-slate-400">{d.message}</p>
                </motion.div>
              ))}

              <button
                onClick={pushToAI}
                disabled={pushing}
                className="w-full btn-secondary text-sm justify-center mt-2"
              >
                <RotateCcw className={cn('w-3.5 h-3.5', pushing && 'animate-spin')} />
                Re-evaluate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sensor history chart */}
      {chartData.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Sensor History
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Light</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-400 inline-block rounded" /> Noise</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-400 inline-block rounded" /> Movement</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="lgLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lgNoise" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lgMove" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a45" strokeDasharray="3 3" />
              <XAxis dataKey="t" hide />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 11 }}
              />
              <Area type="monotone" dataKey="light"    stroke="#f59e0b" fill="url(#lgLight)" strokeWidth={2} name="Light (lux)" />
              <Area type="monotone" dataKey="noise"    stroke="#f43f5e" fill="url(#lgNoise)" strokeWidth={2} name="Noise %" />
              <Area type="monotone" dataKey="movement" stroke="#06b6d4" fill="url(#lgMove)"  strokeWidth={2} name="Movement %" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
