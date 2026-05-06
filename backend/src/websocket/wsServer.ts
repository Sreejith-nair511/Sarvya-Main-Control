// ============================================================
// SARVYA WebSocket Server
// Real-time sync of twin updates, cognitive alerts, hardware
// data, and companion messages across all platforms.
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';
import { WS_EVENTS } from '../../../shared/constants';

interface SarvyaClient {
  ws: WebSocket;
  userId?: string;
  platform?: 'web' | 'mobile' | 'game';
  deviceId?: string;
}

const clients = new Map<string, SarvyaClient>();

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).slice(2);
    clients.set(clientId, { ws });

    console.log(`[WS] Client connected: ${clientId} (total: ${clients.size})`);

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(clientId, msg);
      } catch {
        ws.send(JSON.stringify({ error: 'Invalid JSON message' }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`[WS] Client disconnected: ${clientId} (total: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error for client ${clientId}:`, err.message);
    });

    // Send welcome
    ws.send(JSON.stringify({
      event: 'connected',
      clientId,
      message: 'Connected to SARVYA real-time server',
      timestamp: new Date().toISOString(),
    }));
  });
}

function handleMessage(clientId: string, msg: Record<string, unknown>): void {
  const client = clients.get(clientId);
  if (!client) return;

  switch (msg.event) {
    case 'register':
      // Client registers with userId and platform
      clients.set(clientId, {
        ...client,
        userId: msg.userId as string,
        platform: msg.platform as 'web' | 'mobile' | 'game',
        deviceId: msg.deviceId as string | undefined,
      });
      client.ws.send(JSON.stringify({
        event: 'registered',
        userId: msg.userId,
        platform: msg.platform,
        timestamp: new Date().toISOString(),
      }));
      break;

    case WS_EVENTS.SYNC_REQUEST:
      // Broadcast sync request to all clients of same user
      broadcastToUser(msg.userId as string, clientId, {
        event: WS_EVENTS.SYNC_REQUEST,
        from: client.platform,
        timestamp: new Date().toISOString(),
      });
      break;

    case WS_EVENTS.HARDWARE_DATA:
      // Broadcast hardware data to all clients of same user
      broadcastToUser(msg.userId as string, clientId, {
        event: WS_EVENTS.HARDWARE_DATA,
        data: msg.data,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'ping':
      client.ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
      break;

    default:
      client.ws.send(JSON.stringify({ error: `Unknown event: ${msg.event}` }));
  }
}

// ── Broadcast helpers (called by services) ───────────────────

export function broadcastToUser(
  userId: string,
  excludeClientId: string | null,
  payload: Record<string, unknown>
): void {
  for (const [id, client] of clients.entries()) {
    if (client.userId === userId && id !== excludeClientId) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(payload));
      }
    }
  }
}

export function broadcastTwinUpdate(userId: string, twinState: unknown): void {
  broadcastToUser(userId, null, {
    event: WS_EVENTS.TWIN_UPDATE,
    data: twinState,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastCognitiveAlert(userId: string, alert: unknown): void {
  broadcastToUser(userId, null, {
    event: WS_EVENTS.COGNITIVE_ALERT,
    data: alert,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastAccessibilityChange(userId: string, prefs: unknown): void {
  broadcastToUser(userId, null, {
    event: WS_EVENTS.ACCESSIBILITY_CHANGE,
    data: prefs,
    timestamp: new Date().toISOString(),
  });
}

export function getConnectedClients(): number {
  return clients.size;
}
