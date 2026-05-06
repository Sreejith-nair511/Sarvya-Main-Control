# SARVYA Rover Hardware

## Wiring

| Sensor  | ESP32 Pin | Type    | Notes                          |
|---------|-----------|---------|--------------------------------|
| MIC     | GPIO 34   | Analog  | Sound/noise level              |
| LDR     | GPIO 35   | Analog  | Light level (higher = darker)  |
| BTN     | GPIO 0    | Digital | Pull-up, active LOW            |
| TILT    | GPIO 4    | Digital | Tilt switch                    |
| SHOCK   | GPIO 5    | Digital | Shock/vibration sensor         |
| IR      | GPIO 18   | Digital | IR proximity sensor            |
| LED     | GPIO 2    | Digital | Status LED (built-in)          |

## Flash Instructions

1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP32 board: `File → Preferences → Additional Board URLs`:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Install libraries via `Tools → Manage Libraries`:
   - `PubSubClient` by Nick O'Leary
   - `ArduinoJson` by Benoit Blanchon
4. Open `sarvya_rover.ino`
5. Set your WiFi credentials in the config section
6. Select board: `ESP32 Dev Module`
7. Upload

## MQTT Data Flow

```
ESP32 → WiFi → HiveMQ (broker.hivemq.com:1883)
                  ↓
         Topic: hackathon/teamrover/telemetry
                  ↓
         SARVYA Web App (useMQTT hook)
                  ↓
         /api/mqtt-bridge → Supabase sensor_data
                  ↓
         Supabase Realtime → All connected clients
                  ↓
         AI Adaptation Engine → Twin/Accessibility updates
```

## Payload Format

```json
{
  "device_id": "esp32-rover-001",
  "ts": 12345678,
  "mic": 45,
  "ldr": 2048,
  "btn": 3,
  "tilt": 0,
  "shock": 0,
  "ir": 1,
  "battery": 85
}
```
