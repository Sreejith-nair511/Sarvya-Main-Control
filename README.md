# SARVYA Control Center

An inclusive, accessibility-first AI learning ecosystem that adapts in real time to cognitive ability, environment, and user needs. Built for the 2026 hackathon.

---

## What It Does

SARVYA connects a physical rover (ESP32) to an AI-powered web dashboard and mobile app. Sensor data from the rover flows through MQTT into Supabase, where it triggers AI adaptation decisions that change how content is delivered to the learner — all in real time.

The system tracks a digital twin of each learner, predicts learning difficulties before they happen, and automatically adjusts difficulty, content format, and explanation style based on both performance data and physical environment data.

---

## Architecture

```
ESP32 Rover (sensors)
    |
    | MQTT (HiveMQ broker)
    |
Next.js API Route (/api/mqtt-bridge)
    |
    | Supabase (PostgreSQL + Realtime)
    |
    +-- Web Dashboard (Next.js 14)
    +-- Android App (Flutter + Native)
    +-- Learning Game (built-in)
```

All platforms share the same Supabase database as the single source of truth. Changes made on any platform propagate to all others via Supabase Realtime subscriptions.

---

## Features

### AI Learning Twin
- Tracks understanding score, engagement score, and cognitive load per user
- Predicts weak areas from session history using exponential moving average
- Automatically adjusts difficulty level (very-easy to very-hard) based on performance
- Recommends content format (text, audio, visual, interactive, simplified) based on current state
- Full adaptation history stored in Supabase

### One-Click Accessibility Transformer
- Converts any content into audio (SSML for TTS), simplified text, visual diagrams, story format, step-by-step instructions, and real-world examples
- Voice input (STT) via Web Speech API — students can speak their question
- Download outputs as TXT or HTML
- Video script generator — produces a 60-second 4-scene educational video script
- Powered by Groq LLaMA 3 for AI-generated transformations

### Conversational AI Companion
- Real AI responses via Groq LLaMA 3 (not rule-based)
- Adapts communication style: beginner (simple, encouraging), intermediate, advanced (technical)
- Voice output via Web Speech API
- Full conversation history stored in Supabase per session key
- Context-aware: uses twin state (weak areas, understanding score) to shape responses

### Cognitive Load Balancer
- Evaluates cognitive state from response time, error rate, session duration, and sensor data
- States: focused, optimal, distracted, low-engagement, overloaded
- Recommends: take-break, change-format, increase-engagement, shorten-session
- Trend analysis over last 20 events (improving / stable / worsening)

### Hardware Integration (ESP32 Rover)
- Sensors: MIC (noise), LDR (light), button (interaction), tilt, shock, IR
- Publishes JSON to MQTT topic `hackathon/teamrover/telemetry` every 2 seconds
- MQTT bridge API route normalizes raw ADC values and stores in Supabase
- AI decisions triggered automatically:
  - Low light → audio learning mode + high contrast UI
  - High noise → reduce difficulty + focus warning
  - High movement → switch to interactive/game mode
  - Low interaction → switch to visual content
  - Low battery → reduce visual effects
- Demo mode with 6 pre-collected field scenarios for presentations

### Learning Game
- Adaptive quiz with 5 difficulty levels
- Question bank covers math, science, general knowledge
- XP system, streak multiplier, score tracking
- Updates the AI twin after each game session

### Learning Map
- Visual learning path with 6 subject nodes
- Nodes unlock based on average performance score
- Completion tracking per subject
- Score trend chart from session history

### Session Replay
- Full history of all learning sessions
- Expandable detail view: topics attempted, AI adaptations applied, accessibility features used
- Bar chart of score history

### Career OS
- Embedded SARVYA Career Portal (https://sarvya-carrer.vercel.app/) in an iframe
- 5 career path modules: Technology, Science, Healthcare, Law, Arts
- Module completion tracking with XP

### Accessibility Settings
- 5 display modes: Standard, High Contrast, Large Text, Voice First, Simplified
- Font size slider (12px to 32px)
- Toggles: high contrast, large text, reduced motion, screen reader optimized, audio learning, voice navigation, simplified text
- Explain-It-My-Way: choose story, step-by-step, diagram, or example format
- Communication style: beginner, intermediate, advanced
- All settings persist to Supabase and sync across devices

### Multi-language Support
- English, Hindi, Tamil, Bengali
- Language switcher in sidebar
- Full UI translation via i18next

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| State Management | Zustand with persistence |
| Authentication | Clerk |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSocket) |
| AI / LLM | Groq LLaMA 3 (llama3-8b-8192) |
| Hardware | ESP32, Arduino, MQTT via HiveMQ |
| Mobile | Flutter (cross-platform), React Native |
| i18n | i18next, react-i18next |

---

## Project Structure

```
sarvya-main-control/
├── frontend/
│   └── web/                    # Next.js 14 web dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/        # All API routes (no separate backend)
│       │   │   │   ├── twin/
│       │   │   │   ├── companion/
│       │   │   │   ├── cognitive/
│       │   │   │   ├── hardware/
│       │   │   │   ├── mqtt-bridge/
│       │   │   │   ├── transform/
│       │   │   │   ├── sessions/
│       │   │   │   └── accessibility/
│       │   │   ├── sign-in/
│       │   │   ├── sign-up/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/
│       │   │   ├── layout/     # Sidebar, DashboardShell, AccessibilityWrapper
│       │   │   ├── pages/      # One component per page
│       │   │   └── ui/         # Shared UI components
│       │   ├── hooks/          # useSupabaseRealtime, useMQTT
│       │   ├── lib/            # api.ts, supabase.ts, i18n.ts, utils.ts
│       │   └── store/          # Zustand store
│       └── public/
│           └── downloads/      # APK files for download
├── hardware/
│   ├── esp32_firmware/
│   │   └── sarvya_rover.ino    # Arduino firmware
│   └── README.md
├── supabase/
│   └── schema.sql              # Full database schema with RLS policies
├── shared/
│   ├── types/                  # TypeScript interfaces
│   └── constants/              # Thresholds, endpoints, defaults
└── Android App/                # Pre-built APK files
```

---

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project
- A Clerk application
- A Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/Sreejith-nair511/Sarvya-Main-Control.git
cd Sarvya-Main-Control
```

### 2. Install dependencies

```bash
cd frontend/web
npm install
```

### 3. Configure environment variables

Create `frontend/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

GROQ_API_KEY=your_groq_api_key

NEXT_PUBLIC_MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt
NEXT_PUBLIC_MQTT_TOPIC=hackathon/teamrover/telemetry
```

### 4. Set up the database

Open your Supabase project dashboard, go to SQL Editor, and run the contents of `supabase/schema.sql`.

Then enable Realtime for these tables in Supabase Dashboard under Database > Replication:
- twin_states
- cognitive_events
- sensor_data
- profiles

### 5. Run the development server

```bash
cd frontend/web
npm run dev
```

Open http://localhost:3000

---

## Hardware Setup

Flash `hardware/esp32_firmware/sarvya_rover.ino` to an ESP32 using Arduino IDE.

Required libraries (install via Arduino Library Manager):
- PubSubClient by Nick O'Leary
- ArduinoJson by Benoit Blanchon

Edit the WiFi credentials in the firmware before flashing:

```cpp
const char* WIFI_SSID     = "your_wifi_ssid";
const char* WIFI_PASSWORD = "your_wifi_password";
```

Wiring:

| Sensor | ESP32 Pin |
|--------|-----------|
| MIC (analog) | GPIO 34 |
| LDR (analog) | GPIO 35 |
| Button | GPIO 0 |
| Tilt | GPIO 4 |
| Shock | GPIO 5 |
| IR | GPIO 18 |

If you do not have hardware, use the Demo Mode on the Hardware page in the dashboard. It plays back pre-collected field data through the full AI adaptation pipeline.

---

## Mobile Apps

Three APK builds are available for download from the Access page in the dashboard:

- **SARVYA Flutter** — Cross-platform build (Android 5.0+, iOS 12+ via sideload)
- **SARVYA v6** — Latest stable Android native build
- **SARVYA Debug** — Development build with debug tools

---

## API Routes

All API logic runs inside Next.js. No separate backend process is needed.

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/twin | Get AI twin state |
| POST | /api/twin | Update twin after session |
| GET | /api/twin/predict | Get learning difficulty prediction |
| POST | /api/companion | Chat with AI companion |
| POST | /api/cognitive | Evaluate cognitive load |
| GET | /api/cognitive | Get cognitive load trend |
| POST | /api/hardware | Ingest rover sensor data |
| POST | /api/mqtt-bridge | MQTT to Supabase bridge |
| POST | /api/transform | Transform content with Groq |
| POST | /api/sessions | Create learning session |
| GET | /api/sessions | Get sessions for user |
| GET/PUT | /api/accessibility | Get or update accessibility preferences |

---

## Accessibility Standards

SARVYA targets WCAG 2.1 AA compliance. Implemented features:

- High contrast mode
- Large text mode (up to 32px base font)
- Reduced motion mode
- Screen reader optimized ARIA labels
- Keyboard navigation with visible focus rings
- Voice input (STT) via Web Speech API
- Voice output (TTS) via SpeechSynthesis API
- Simplified text mode
- Audio learning mode
- Cognitive load balancing
- Hardware-driven automatic mode switching
- Multi-language support (English, Hindi, Tamil, Bengali)

---

## License

MIT
