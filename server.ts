import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: '10mb' }));

export interface ServerEncryptedMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  ciphertext: string;       // Base64 encrypted payload
  iv: string;               // Base64 Initialization Vector (12 bytes)
  authTag?: string;         // Authentication tag / integrity indicator
  keyFingerprint?: string;  // First 8 chars of key hash for verification
  timestamp: number;
  timerSeconds: number;     // 0 = off, >0 = seconds until self-destruct
  isBurnAfterReading: boolean;
  burnRevealedAt?: number;  // Timestamp when revealed by recipient
  burnCountdown?: number;   // Configured burn duration in seconds
  expiresAt?: number;       // Exact epoch when message will be purged
  mediaType?: 'text' | 'image' | 'voice';
}

interface RoomParticipant {
  ws: WebSocket;
  userId: string;
  userName: string;
  joinedAt: number;
  publicKey?: string; // Base64 SPKI
}

// In-memory zero-knowledge transient store (cleared on timer / server restart)
const rooms = new Map<string, {
  participants: Map<string, RoomParticipant>;
  messages: Map<string, ServerEncryptedMessage>;
  timerHandles: Map<string, NodeJS.Timeout>;
}>();

function getOrCreateRoom(roomId: string) {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      participants: new Map(),
      messages: new Map(),
      timerHandles: new Map(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

function broadcastToRoom(roomId: string, data: object, excludeUserId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(data);
  for (const [userId, participant] of room.participants.entries()) {
    if (excludeUserId && userId === excludeUserId) continue;
    if (participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(payload);
    }
  }
}

function scheduleMessageDestruction(roomId: string, messageId: string, delayMs: number) {
  const room = rooms.get(roomId);
  if (!room) return;

  // Clear existing handle if any
  const existing = room.timerHandles.get(messageId);
  if (existing) clearTimeout(existing);

  const handle = setTimeout(() => {
    const currentRoom = rooms.get(roomId);
    if (!currentRoom) return;

    if (currentRoom.messages.has(messageId)) {
      currentRoom.messages.delete(messageId);
      currentRoom.timerHandles.delete(messageId);
      // Notify clients that the message was shredded permanently
      broadcastToRoom(roomId, {
        type: 'message_destroyed',
        roomId,
        messageId,
        reason: 'expired',
      });
    }
  }, Math.max(0, delayMs));

  room.timerHandles.set(messageId, handle);
}

// WebSocket Connection Management
wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;
  let isAlive = true;

  ws.on('pong', () => {
    isAlive = true;
  });

  ws.on('message', (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type } = data;

      if (type === 'join') {
        const { roomId, userId, userName, publicKey } = data;
        currentRoomId = roomId;
        currentUserId = userId;

        const room = getOrCreateRoom(roomId);
        room.participants.set(userId, {
          ws,
          userId,
          userName: userName || 'Anonim',
          joinedAt: Date.now(),
          publicKey,
        });

        // Send existing active messages to user
        const activeMessages = Array.from(room.messages.values()).filter(
          (m) => !m.expiresAt || m.expiresAt > Date.now()
        );

        // Send participant list
        const participantList = Array.from(room.participants.values()).map((p) => ({
          userId: p.userId,
          userName: p.userName,
          publicKey: p.publicKey,
        }));

        ws.send(JSON.stringify({
          type: 'room_state',
          roomId,
          participants: participantList,
          messages: activeMessages,
        }));

        // Broadcast user joined to other room participants
        broadcastToRoom(roomId, {
          type: 'user_joined',
          roomId,
          user: { userId, userName, publicKey },
          participants: participantList,
        }, userId);
      }

      else if (type === 'send_message') {
        const { roomId, message } = data;
        const room = getOrCreateRoom(roomId);

        const newMsg: ServerEncryptedMessage = {
          ...message,
          timestamp: Date.now(),
        };

        // If self-destruct timer is set and NOT burn-after-reading, schedule auto-destruction
        if (newMsg.timerSeconds && newMsg.timerSeconds > 0 && !newMsg.isBurnAfterReading) {
          const delayMs = newMsg.timerSeconds * 1000;
          newMsg.expiresAt = Date.now() + delayMs;
          scheduleMessageDestruction(roomId, newMsg.id, delayMs);
        }

        room.messages.set(newMsg.id, newMsg);

        // Broadcast to all participants in the room
        broadcastToRoom(roomId, {
          type: 'new_message',
          roomId,
          message: newMsg,
        });
      }

      else if (type === 'burn_reveal') {
        // Recipient has clicked to reveal a "Burn After Reading" message
        const { roomId, messageId, countdownSeconds = 10 } = data;
        const room = rooms.get(roomId);
        if (!room) return;

        const msg = room.messages.get(messageId);
        if (msg && msg.isBurnAfterReading && !msg.burnRevealedAt) {
          const now = Date.now();
          msg.burnRevealedAt = now;
          msg.burnCountdown = countdownSeconds;
          msg.expiresAt = now + countdownSeconds * 1000;

          // Schedule destruction
          scheduleMessageDestruction(roomId, messageId, countdownSeconds * 1000);

          // Broadcast reveal event with countdown to all participants
          broadcastToRoom(roomId, {
            type: 'burn_countdown_started',
            roomId,
            messageId,
            burnRevealedAt: msg.burnRevealedAt,
            countdownSeconds,
            expiresAt: msg.expiresAt,
          });
        }
      }

      else if (type === 'shred_message') {
        // Immediate manual shred / delete
        const { roomId, messageId } = data;
        const room = rooms.get(roomId);
        if (room) {
          const timer = room.timerHandles.get(messageId);
          if (timer) clearTimeout(timer);
          room.timerHandles.delete(messageId);
          room.messages.delete(messageId);

          broadcastToRoom(roomId, {
            type: 'message_destroyed',
            roomId,
            messageId,
            reason: 'manual_shred',
          });
        }
      }

      else if (type === 'purge_room') {
        // Panic Button: Wipes all messages in room immediately!
        const { roomId } = data;
        const room = rooms.get(roomId);
        if (room) {
          for (const timer of room.timerHandles.values()) {
            clearTimeout(timer);
          }
          room.timerHandles.clear();
          room.messages.clear();

          broadcastToRoom(roomId, {
            type: 'room_purged',
            roomId,
            purgedAt: Date.now(),
          });
        }
      }

      else if (type === 'typing') {
        const { roomId, userId, userName, isTyping } = data;
        broadcastToRoom(roomId, {
          type: 'typing_indicator',
          roomId,
          userId,
          userName,
          isTyping,
        }, userId);
      }

      // WebRTC Video / Audio Call Signaling
      else if (type === 'call_request') {
        const { roomId, callerId, callerName, isVideo, offer } = data;
        broadcastToRoom(roomId, {
          type: 'incoming_call',
          roomId,
          callerId,
          callerName,
          isVideo,
          offer,
        }, callerId);
      }

      else if (type === 'call_accepted') {
        const { roomId, callerId, recipientId, recipientName, answer } = data;
        broadcastToRoom(roomId, {
          type: 'call_accepted',
          roomId,
          callerId,
          recipientId,
          recipientName,
          answer,
        }, recipientId);
      }

      else if (type === 'call_rejected') {
        const { roomId, callerId, recipientId } = data;
        broadcastToRoom(roomId, {
          type: 'call_rejected',
          roomId,
          callerId,
          recipientId,
        });
      }

      else if (type === 'call_ended') {
        const { roomId, userId } = data;
        broadcastToRoom(roomId, {
          type: 'call_ended',
          roomId,
          userId,
        });
      }

      else if (type === 'ice_candidate') {
        const { roomId, candidate, senderId, targetUserId } = data;
        broadcastToRoom(roomId, {
          type: 'ice_candidate',
          roomId,
          candidate,
          senderId,
          targetUserId,
        }, senderId);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentUserId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.participants.delete(currentUserId);
        const remaining = Array.from(room.participants.values()).map((p) => ({
          userId: p.userId,
          userName: p.userName,
          publicKey: p.publicKey,
        }));

        broadcastToRoom(currentRoomId, {
          type: 'user_left',
          roomId: currentRoomId,
          userId: currentUserId,
          participants: remaining,
        });

        // Clean up empty room after 1 hour of inactivity
        if (room.participants.size === 0 && room.messages.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});

// Periodic ping to keep alive
setInterval(() => {
  wss.clients.forEach((ws) => {
    ws.ping();
  });
}, 30000);

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    e2eeEngine: 'WebCrypto-AES-256-GCM',
    zeroKnowledge: true,
    activeRooms: rooms.size,
    timestamp: Date.now(),
  });
});

app.get('/api/config', (req, res) => {
  const devUrl = 'https://ais-dev-jwb32u26qakk32j3gvoatg-514591033728.asia-east1.run.app';
  const sharedUrl = 'https://ais-pre-jwb32u26qakk32j3gvoatg-514591033728.asia-east1.run.app';
  res.json({
    devUrl,
    sharedUrl,
    appUrl: sharedUrl,
  });
});

// Vite Middleware for Development / Static Serve for Production
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[AegisCrypt Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
