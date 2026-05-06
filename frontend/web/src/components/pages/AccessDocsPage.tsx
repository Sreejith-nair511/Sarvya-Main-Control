
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Download, Smartphone, Globe, Cpu,
  Copy, Check, CheckCircle, ExternalLink, Maximize2,
  Minimize2, Shield, Star, Zap, Code2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const TABS = ['Downloads', 'Career Portal', 'ESP32 Firmware', 'API Reference', 'Accessibility'];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-surface rounded-xl p-4 text-xs text-slate-300 font-mono overflow-x-auto border border-surface-border leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-hover border border-surface-border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
      </button>
    </div>
  );
}

// ── APK Download Card ─────────────────────────────────────────
function ApkCard({
  name, filename, version, size, description, isLatest, isFlutter,
}: {
  name: string; filename: string; version: string;
  size: string; description: string; isLatest?: boolean; isFlutter?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);

  function download() {
    setDownloading(true);
    const a = document.createElement('a');
    a.href = `/downloads/${encodeURIComponent(filename)}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 2000);
    toast.success(`Downloading ${name}...`);
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'card p-5 space-y-4 relative overflow-hidden',
        isLatest && 'border-brand-500/40',
        isFlutter && 'border-cyan-500/40'
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {isFlutter && <Badge variant="cyan">Flutter</Badge>}
        {isLatest && !isFlutter && <Badge variant="brand">Latest</Badge>}
      </div>

      {/* Glow */}
      {(isLatest || isFlutter) && (
        <div className={cn(
          'absolute inset-0 pointer-events-none',
          isFlutter
            ? 'bg-gradient-to-br from-cyan-600/5 to-brand-600/5'
            : 'bg-gradient-to-br from-brand-600/5 to-violet-600/5'
        )} />
      )}

      <div className="flex items-start gap-4">
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
          isFlutter
            ? 'bg-gradient-to-br from-cyan-500 to-brand-500 shadow-glow-cyan'
            : isLatest
              ? 'bg-gradient-brand shadow-glow-brand'
              : 'bg-surface-hover border border-surface-border'
        )}>
          <Smartphone className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <p className="text-base font-bold text-white">{name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>v{version}</span>
            <span>·</span>
            <span>{size}</span>
          </div>
        </div>
      </div>

      {/* Platform badges */}
      {isFlutter ? (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <span>🤖</span> Android 5.0+
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-xs text-slate-300">
            <span>🍎</span> iOS 12+ (sideload)
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
            <span>⚡</span> Flutter 3
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {['AI Learning Twin', 'Voice Input', 'Offline Mode', 'Accessibility'].map(f => (
            <span key={f} className="px-2 py-0.5 rounded-lg bg-surface text-xs text-slate-400 border border-surface-border">{f}</span>
          ))}
        </div>
      )}

      {/* iOS note for Flutter */}
      {isFlutter && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <p className="text-xs text-cyan-300 font-semibold mb-1">iOS Installation</p>
          <p className="text-xs text-slate-400">
            For iOS, use <strong className="text-white">AltStore</strong> or <strong className="text-white">Sideloadly</strong> to sideload the IPA, or ask your developer to sign it with your Apple ID.
          </p>
        </div>
      )}

      {/* Android install note */}
      {!isFlutter && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-300 font-semibold mb-1">Before installing:</p>
          <p className="text-xs text-slate-400">
            Enable <strong className="text-white">Unknown Sources</strong> in Android Settings → Security → Install unknown apps
          </p>
        </div>
      )}

      <button
        onClick={download}
        disabled={downloading}
        className={cn('w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
          isFlutter
            ? 'bg-gradient-to-r from-cyan-500 to-brand-500 text-white hover:opacity-90 shadow-glow-cyan'
            : isLatest
              ? 'bg-gradient-brand text-white shadow-glow-brand hover:opacity-90'
              : 'bg-surface-hover border border-surface-border text-white hover:border-brand-500/40'
        )}
      >
        <Download className={cn('w-4 h-4', downloading && 'animate-bounce')} />
        {downloading ? 'Downloading...' : `Download ${name}`}
      </button>
    </motion.div>
  );
}

// ── Career Portal Embed ───────────────────────────────────────
function CareerPortalEmbed() {
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const CAREER_URL = 'https://sarvya-carrer.vercel.app/';

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-surface-border">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface text-xs text-slate-400 border border-surface-border font-mono">
            <Globe className="w-3 h-3" />
            {CAREER_URL}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={CAREER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost p-2"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="btn-ghost p-2"
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* iFrame */}
      <div className={cn(
        'relative rounded-2xl overflow-hidden border border-surface-border bg-surface transition-all duration-300',
        fullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : 'h-[600px]'
      )}>
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface z-10">
            <div className="w-10 h-10 border-2 border-surface-border border-t-brand-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading SARVYA Career Portal...</p>
          </div>
        )}
        <iframe
          src={CAREER_URL}
          className="w-full h-full border-0"
          title="SARVYA Career Portal"
          onLoad={() => setLoaded(true)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-surface-card border border-surface-border text-white hover:bg-surface-hover z-20"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setFullscreen(false)} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export function AccessDocsPage() {
  const [activeTab, setActiveTab] = useState('Downloads');

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Access & Documentation"
        subtitle="Download the app, explore the career portal, and integrate SARVYA"
        icon={<BookOpen className="w-6 h-6 text-white" />}
        iconColor="from-rose-500 to-orange-500"
      />

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
              activeTab === tab
                ? 'bg-brand-600/20 text-brand-300 border-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-surface-hover border-transparent'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >

          {/* ── DOWNLOADS ──────────────────────────────────── */}
          {activeTab === 'Downloads' && (
            <div className="space-y-6">
              {/* Hero banner */}
              <div className="card p-6 border border-brand-500/30 bg-gradient-to-br from-brand-600/10 to-violet-600/10">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-brand shadow-glow-brand shrink-0">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">SARVYA Android App</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      The full SARVYA learning ecosystem on your Android device. Syncs with the web dashboard in real time via Supabase.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[
                        { icon: Zap,    label: 'AI Learning Twin' },
                        { icon: Globe,  label: 'Offline Support'  },
                        { icon: Shield, label: 'Secure & Private' },
                        { icon: Star,   label: 'Accessibility First' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-hover border border-surface-border text-xs text-slate-300">
                          <Icon className="w-3 h-3 text-brand-400" />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* APK cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ApkCard
                  name="SARVYA Flutter"
                  filename="flutter app.apk"
                  version="1.0"
                  size="Cross-platform"
                  description="Flutter build — works on Android and iOS. Lightweight, fast, and fully accessible"
                  isLatest
                  isFlutter
                />
                <ApkCard
                  name="SARVYA v6"
                  filename="sarvya-v6.apk"
                  version="6.0"
                  size="57.5 MB"
                  description="Latest stable Android release with all AI features, accessibility modes, and hardware integration"
                />
                <ApkCard
                  name="SARVYA Debug"
                  filename="sarvya-debug.apk"
                  version="debug"
                  size="24.6 MB"
                  description="Development build for testing. Includes debug logs and developer tools"
                />
              </div>

              {/* Install guide */}
              <div className="card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Installation Guide</h2>
                <div className="space-y-3">
                  {[
                    { step: '1', title: 'Download the APK',          desc: 'Click the download button above. The file will save to your Downloads folder.' },
                    { step: '2', title: 'Enable Unknown Sources',     desc: 'Go to Settings → Security → Install unknown apps → Allow from this source.' },
                    { step: '3', title: 'Open the APK file',          desc: 'Open your Downloads folder and tap the SARVYA APK file.' },
                    { step: '4', title: 'Install & Launch',           desc: 'Tap Install, wait for it to complete, then tap Open.' },
                    { step: '5', title: 'Sign in with your account',  desc: 'Use the same Clerk account as the web dashboard — all data syncs automatically.' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex items-start gap-4 p-3 rounded-xl bg-surface-hover">
                      <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs flex items-center justify-center shrink-0 font-bold">
                        {step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System requirements */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Android',  value: '5.0+ (Flutter) / 6.0+ (Native)' },
                  { label: 'iOS',      value: '12+ via sideload' },
                  { label: 'RAM',      value: '2 GB min' },
                  { label: 'Storage',  value: '100 MB free' },
                ].map(({ label, value }) => (
                  <div key={label} className="card p-3 text-center">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-white mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CAREER PORTAL ──────────────────────────────── */}
          {activeTab === 'Career Portal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">SARVYA Career Portal</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Explore career paths, skill assessments, and job readiness tools
                  </p>
                </div>
                <a
                  href="https://sarvya-carrer.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full Site
                </a>
              </div>
              <CareerPortalEmbed />
            </div>
          )}

          {/* ── ESP32 FIRMWARE ─────────────────────────────── */}
          {activeTab === 'ESP32 Firmware' && (
            <div className="space-y-6">
              <div className="card p-5 border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">ESP32 Arduino Firmware</p>
                  <Badge variant="emerald">Copy & Flash</Badge>
                </div>
                <p className="text-xs text-slate-400">Flash this to your ESP32. Requires WiFi credentials and HiveMQ broker.</p>
              </div>
              <CodeBlock code={`// SARVYA ESP32 Rover Firmware v2.0
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "hackathon/teamrover/telemetry";
const char* DEVICE_ID     = "esp32-rover-001";

#define PIN_MIC  34
#define PIN_LDR  35
#define PIN_BTN   0
#define PIN_TILT  4
#define PIN_SHOCK 5
#define PIN_IR   18

WiFiClient espClient;
PubSubClient mqtt(espClient);
int btnCount = 0;
bool lastBtn = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BTN, INPUT_PULLUP);
  pinMode(PIN_TILT, INPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (!mqtt.connected()) {
    mqtt.connect(("sarvya-" + String(random(0xffff), HEX)).c_str());
  }
  mqtt.loop();
  bool btn = digitalRead(PIN_BTN);
  if (btn == LOW && lastBtn == HIGH) btnCount++;
  lastBtn = btn;

  static unsigned long last = 0;
  if (millis() - last >= 2000) {
    last = millis();
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["mic"]       = map(analogRead(PIN_MIC), 0, 4095, 0, 100);
    doc["ldr"]       = analogRead(PIN_LDR);
    doc["btn"]       = btnCount;
    doc["tilt"]      = digitalRead(PIN_TILT);
    doc["shock"]     = digitalRead(PIN_SHOCK);
    doc["ir"]        = digitalRead(PIN_IR);
    doc["battery"]   = 85;
    char buf[256];
    serializeJson(doc, buf);
    mqtt.publish(MQTT_TOPIC, buf);
    btnCount = 0;
  }
}`} />
            </div>
          )}

          {/* ── API REFERENCE ──────────────────────────────── */}
          {activeTab === 'API Reference' && (
            <div className="space-y-3">
              <div className="card p-4 border border-brand-500/20 bg-brand-500/5">
                <p className="text-sm text-slate-300">All routes are Next.js App Router routes at <code className="text-brand-300 font-mono">/api/*</code> — no separate backend needed.</p>
              </div>
              {[
                { method: 'GET',  path: '/api/twin?userId=',               desc: 'Get AI twin state' },
                { method: 'POST', path: '/api/twin',                        desc: 'Update twin after session' },
                { method: 'GET',  path: '/api/twin/predict?userId=',        desc: 'Get learning difficulty prediction' },
                { method: 'POST', path: '/api/companion',                   desc: 'Chat with AI companion (Groq LLaMA 3)' },
                { method: 'POST', path: '/api/cognitive',                   desc: 'Evaluate cognitive load' },
                { method: 'GET',  path: '/api/cognitive?userId=',           desc: 'Get cognitive load trend' },
                { method: 'POST', path: '/api/hardware',                    desc: 'Ingest rover sensor data' },
                { method: 'POST', path: '/api/mqtt-bridge',                 desc: 'MQTT → Supabase bridge' },
                { method: 'POST', path: '/api/transform',                   desc: 'Transform content (Groq-powered)' },
                { method: 'POST', path: '/api/sessions',                    desc: 'Create learning session' },
                { method: 'GET',  path: '/api/sessions?userId=',            desc: 'Get all sessions' },
                { method: 'GET',  path: '/api/accessibility?userId=',       desc: 'Get accessibility preferences' },
                { method: 'PUT',  path: '/api/accessibility',               desc: 'Update accessibility preferences' },
              ].map(({ method, path, desc }) => (
                <div key={path} className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover border border-surface-border">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-bold font-mono shrink-0 w-12 text-center',
                    method === 'GET'  ? 'bg-emerald-500/20 text-emerald-400' :
                    method === 'POST' ? 'bg-brand-500/20 text-brand-400' :
                                        'bg-amber-500/20 text-amber-400'
                  )}>{method}</span>
                  <code className="text-xs text-slate-300 font-mono flex-1">{path}</code>
                  <span className="text-xs text-slate-500 hidden md:block shrink-0">{desc}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── ACCESSIBILITY ───────────────────────────────── */}
          {activeTab === 'Accessibility' && (
            <div className="space-y-4">
              <div className="card p-6 space-y-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">WCAG 2.1 AA Compliance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { f: 'High Contrast Mode',        n: 'CSS class mode-high-contrast'       },
                    { f: 'Large Text Mode',            n: 'CSS variable --font-size-base'      },
                    { f: 'Screen Reader Support',      n: 'ARIA labels throughout'             },
                    { f: 'Keyboard Navigation',        n: 'focus-visible ring on all elements' },
                    { f: 'Reduced Motion',             n: 'mode-reduced-motion CSS class'      },
                    { f: 'Voice Navigation (STT)',     n: 'Web Speech API'                     },
                    { f: 'Audio Learning (TTS)',        n: 'SpeechSynthesis API'                },
                    { f: 'Simplified Text Mode',       n: 'Groq-powered simplification'        },
                    { f: 'Multi-language (EN/HI/TA/BN)', n: 'i18next — 4 Indian languages'    },
                    { f: 'Cognitive Load Balancer',    n: 'Real-time sensor + performance'     },
                    { f: 'One-Click Transformer',      n: 'Audio, visual, simplified, story'   },
                    { f: 'Hardware Accessibility',     n: 'ESP32 → auto mode switching'        },
                  ].map(({ f, n }) => (
                    <div key={f} className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover border border-surface-border">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">{f}</p>
                        <p className="text-xs text-slate-500">{n}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
