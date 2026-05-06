/*
 * SARVYA Rover Firmware v2.0
 * ESP32 — Sensor data → MQTT → HiveMQ → Supabase → AI Adaptation
 *
 * Sensors:
 *   MIC    → ADC pin 34 (noise level)
 *   LDR    → ADC pin 35 (light level)
 *   BTN    → GPIO 0     (interaction, active LOW)
 *   TILT   → GPIO 4     (movement disturbance)
 *   SHOCK  → GPIO 5     (shock/vibration)
 *   IR     → GPIO 18    (proximity/movement)
 *
 * Libraries required (install via Arduino IDE Library Manager):
 *   - PubSubClient by Nick O'Leary
 *   - ArduinoJson by Benoit Blanchon
 *   - WiFi (built-in with ESP32 board package)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ── Configuration ─────────────────────────────────────────────
const char* WIFI_SSID     = "vivo Y400 5G";
const char* WIFI_PASSWORD = "Arpitha@";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "hackathon/teamrover/telemetry";
const char* DEVICE_ID     = "esp32-rover-001";

// Publish interval (milliseconds)
const unsigned long PUBLISH_INTERVAL = 2000;

// ── Pin Definitions ───────────────────────────────────────────
#define PIN_MIC    34
#define PIN_LDR    35
#define PIN_BTN     0
#define PIN_TILT    4
#define PIN_SHOCK   5
#define PIN_IR     18

// ── LED for status (built-in on most ESP32 boards) ────────────
#define PIN_LED     2

// ── Globals ───────────────────────────────────────────────────
WiFiClient   espClient;
PubSubClient mqtt(espClient);

int           btnCount     = 0;
bool          lastBtnState = HIGH;
unsigned long lastPublish  = 0;
unsigned long lastReconnect = 0;

// ── WiFi ──────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected: " + WiFi.localIP().toString());
    digitalWrite(PIN_LED, HIGH);
  } else {
    Serial.println("\n[WiFi] Failed — will retry");
  }
}

// ── MQTT ──────────────────────────────────────────────────────
bool connectMQTT() {
  if (mqtt.connected()) return true;

  String clientId = "sarvya-" + String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
  Serial.print("[MQTT] Connecting as " + clientId + "...");

  if (mqtt.connect(clientId.c_str())) {
    Serial.println(" Connected!");
    return true;
  } else {
    Serial.print(" Failed, rc=");
    Serial.println(mqtt.state());
    return false;
  }
}

// ── Sensor reading helpers ────────────────────────────────────
int readNoise() {
  // Average 10 samples for stability
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PIN_MIC);
    delay(1);
  }
  int raw = sum / 10;
  return map(raw, 0, 4095, 0, 100);
}

int readLight() {
  return analogRead(PIN_LDR); // Raw 0-4095 (higher = darker for most LDR circuits)
}

float readBattery() {
  // If you have a voltage divider on ADC pin 32:
  // int raw = analogRead(32);
  // float voltage = (raw / 4095.0) * 3.3 * 2; // assuming 1:1 divider
  // return (voltage / 4.2) * 100; // Li-ion max 4.2V
  return 85.0; // Placeholder — replace with actual reading
}

// ── Setup ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

  // Pin modes
  pinMode(PIN_BTN,   INPUT_PULLUP);
  pinMode(PIN_TILT,  INPUT);
  pinMode(PIN_SHOCK, INPUT);
  pinMode(PIN_IR,    INPUT);
  pinMode(PIN_LED,   OUTPUT);
  digitalWrite(PIN_LED, LOW);

  // ADC resolution
  analogReadResolution(12); // 0-4095

  Serial.println("\n=== SARVYA Rover v2.0 ===");

  connectWiFi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setKeepAlive(60);
  mqtt.setBufferSize(512);
}

// ── Loop ──────────────────────────────────────────────────────
void loop() {
  // Maintain WiFi
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(PIN_LED, LOW);
    connectWiFi();
    return;
  }

  // Maintain MQTT (non-blocking reconnect every 5s)
  if (!mqtt.connected()) {
    unsigned long now = millis();
    if (now - lastReconnect > 5000) {
      lastReconnect = now;
      connectMQTT();
    }
  }
  mqtt.loop();

  // Track button presses
  bool btnState = digitalRead(PIN_BTN);
  if (btnState == LOW && lastBtnState == HIGH) {
    btnCount++;
    Serial.println("[BTN] Press detected, count=" + String(btnCount));
  }
  lastBtnState = btnState;

  // Publish at interval
  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;

    // Read all sensors
    int   noise    = readNoise();
    int   ldr      = readLight();
    int   tilt     = digitalRead(PIN_TILT);
    int   shock    = digitalRead(PIN_SHOCK);
    int   ir       = digitalRead(PIN_IR);
    float battery  = readBattery();

    // Build JSON
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["ts"]        = now;
    doc["mic"]       = noise;
    doc["ldr"]       = ldr;
    doc["btn"]       = btnCount;
    doc["tilt"]      = tilt;
    doc["shock"]     = shock;
    doc["ir"]        = ir;
    doc["battery"]   = (int)battery;

    char payload[256];
    serializeJson(doc, payload);

    if (mqtt.connected()) {
      bool ok = mqtt.publish(MQTT_TOPIC, payload, false);
      if (ok) {
        Serial.println("[MQTT] Published: " + String(payload));
        // Blink LED on successful publish
        digitalWrite(PIN_LED, LOW);
        delay(50);
        digitalWrite(PIN_LED, HIGH);
      } else {
        Serial.println("[MQTT] Publish failed");
      }
    } else {
      Serial.println("[MQTT] Not connected — skipping publish");
    }

    // Reset button count after each publish
    btnCount = 0;
  }
}
