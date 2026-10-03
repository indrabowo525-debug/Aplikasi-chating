import { useState, useEffect, useRef, useCallback } from 'react';
import {
  EncryptedMessagePayload,
  DecryptedMessage,
  RoomParticipantInfo,
  TimerOption,
} from '../types/chat';
import {
  deriveKeyFromPassphrase,
  encryptMessage,
  decryptMessage,
  computeKeyFingerprint,
  getDeterministicRoomSalt,
  bufferToBase64,
  base64ToBuffer,
  bufferToHex,
} from '../lib/crypto';
import {
  playSendSound,
  playReceiveSound,
  playShredSound,
  playRingtoneSound,
  playCallEndSound,
} from '../lib/sound';

interface UseEncryptedChatOptions {
  soundEnabled?: boolean;
}

export interface CallSession {
  peerId: string;
  peerName: string;
  isVideo: boolean;
}

export function useEncryptedChat(
  roomId: string,
  passphrase: string,
  userId: string,
  userName: string,
  options: UseEncryptedChatOptions = {}
) {
  const { soundEnabled = true } = options;

  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipantInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [safetyNumber, setSafetyNumber] = useState<string>('');
  const [fingerprintHex, setFingerprintHex] = useState<string>('');
  const [saltHex, setSaltHex] = useState<string>('');

  // Call states
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    isVideo: boolean;
  } | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const saltRef = useRef<Uint8Array | null>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const keyResolverRef = useRef<((key: CryptoKey) => void) | null>(null);
  const keyPromiseRef = useRef<Promise<CryptoKey>>(
    new Promise<CryptoKey>((resolve) => {
      keyResolverRef.current = resolve;
    })
  );

  // Initialize Cryptographic Key from Passphrase and Deterministic Room Salt
  useEffect(() => {
    let isCancelled = false;

    // Reset key promise for new room/passphrase
    keyPromiseRef.current = new Promise<CryptoKey>((resolve) => {
      keyResolverRef.current = resolve;
    });

    async function initCrypto() {
      try {
        // Derive canonical room salt deterministically from roomId
        // This ensures all users in the same room derive the exact same AES-256 key
        const salt = await getDeterministicRoomSalt(roomId);
        if (isCancelled) return;

        saltRef.current = salt;
        setSaltHex(bufferToHex(salt));

        const key = await deriveKeyFromPassphrase(passphrase, salt);
        if (isCancelled) return;

        cryptoKeyRef.current = key;
        setCryptoKey(key);
        if (keyResolverRef.current) {
          keyResolverRef.current(key);
        }

        // Compute 60-digit safety number & hex fingerprint
        const { safetyNumber: sn, fingerprintHex: fp } = await computeKeyFingerprint(key, salt);
        if (isCancelled) return;

        setSafetyNumber(sn);
        setFingerprintHex(fp);
      } catch (err) {
        console.error('Failed to derive cryptographic key:', err);
      }
    }

    initCrypto();
    return () => {
      isCancelled = true;
    };
  }, [roomId, passphrase]);

  // Connect to WebSocket Server & BroadcastChannel
  useEffect(() => {
    if (!roomId || !userId) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;

    // Helper to handle incoming events from both WebSocket and BroadcastChannel
    const handleIncomingEvent = async (data: any) => {
      try {
        if (data.type === 'room_state') {
          setParticipants(data.participants || []);
          const rawMsgs: EncryptedMessagePayload[] = data.messages || [];
          const decryptedList: DecryptedMessage[] = [];

          for (const msg of rawMsgs) {
            const dec = await decryptSingleMessage(msg);
            decryptedList.push(dec);
          }
          setMessages(decryptedList);
        }

        else if (data.type === 'user_joined') {
          setParticipants(data.participants || []);
        }

        else if (data.type === 'user_left') {
          setParticipants(data.participants || []);
        }

        else if (data.type === 'new_message') {
          const rawMsg: EncryptedMessagePayload = data.message;
          const dec = await decryptSingleMessage(rawMsg);

          setMessages((prev) => {
            const existingIndex = prev.findIndex((m) => m.id === rawMsg.id);
            if (existingIndex >= 0) {
              // If already present (e.g. optimistic add), merge any server updates
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                ...dec,
                // Keep local plaintext if it was already known
                plaintext: updated[existingIndex].plaintext || dec.plaintext,
              };
              return updated;
            }
            return [...prev, dec];
          });

          if (rawMsg.senderId !== userId) {
            playReceiveSound(soundEnabled);
          }
        }

        else if (data.type === 'burn_countdown_started') {
          const { messageId, burnRevealedAt, countdownSeconds, expiresAt } = data;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    burnRevealedAt,
                    burnCountdown: countdownSeconds,
                    expiresAt,
                  }
                : m
            )
          );
        }

        else if (data.type === 'message_destroyed') {
          const { messageId } = data;
          playShredSound(soundEnabled);
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        }

        else if (data.type === 'room_purged') {
          playShredSound(soundEnabled);
          setMessages([]);
        }

        // WebRTC Video / Audio Call Handlers
        else if (data.type === 'incoming_call') {
          if (data.callerId !== userId) {
            setIncomingCall({
              callerId: data.callerId,
              callerName: data.callerName || 'Teman Obrolan',
              isVideo: data.isVideo ?? true,
            });
            playRingtoneSound(soundEnabled);
          }
        }

        else if (data.type === 'call_accepted') {
          if (data.callerId === userId) {
            setActiveCall({
              peerId: data.recipientId,
              peerName: data.recipientName || 'Teman Obrolan',
              isVideo: true,
            });
          }
        }

        else if (data.type === 'call_rejected') {
          setActiveCall(null);
          setIncomingCall(null);
          playCallEndSound(soundEnabled);
        }

        else if (data.type === 'call_ended') {
          setActiveCall(null);
          setIncomingCall(null);
          playCallEndSound(soundEnabled);
        }
      } catch (err) {
        console.error('Error handling event:', err);
      }
    };

    // Listen on BroadcastChannel for instant local inter-client sync
    if (bc) {
      bc.onmessage = (event) => {
        handleIncomingEvent(event.data);
      };
    }

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          // Send join message
          socket?.send(
            JSON.stringify({
              type: 'join',
              roomId,
              userId,
              userName,
            })
          );
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleIncomingEvent(data);
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        };

        socket.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimeout = setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
      if (bc) {
        bc.close();
      }
    };
  }, [roomId, userId, userName, soundEnabled]);

  // Decrypt incoming message
  const decryptSingleMessage = async (
    msg: EncryptedMessagePayload
  ): Promise<DecryptedMessage> => {
    try {
      // Ensure key is derived before attempting decrypt
      const key = cryptoKeyRef.current || (await keyPromiseRef.current);
      if (!key) {
        return { ...msg, decryptionError: true };
      }

      const plaintext = await decryptMessage(
        msg.ciphertext,
        msg.iv,
        msg.authTag,
        key
      );

      return {
        ...msg,
        plaintext,
        decryptionError: false,
      };
    } catch (err) {
      console.warn('Failed to decrypt message (key mismatch or tampered):', err);
      return {
        ...msg,
        decryptionError: true,
      };
    }
  };

  // Send Encrypted Message
  const sendMessage = useCallback(
    async (
      content: string,
      timerSeconds: number,
      isBurnAfterReading: boolean,
      mediaType: 'text' | 'image' = 'text'
    ) => {
      setIsEncrypting(true);
      try {
        const key = cryptoKeyRef.current || (await keyPromiseRef.current);
        if (!key) {
          throw new Error('Kunci kriptografi belum siap.');
        }

        const { ciphertext, iv, authTag } = await encryptMessage(content, key);
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const salt = saltRef.current || (await getDeterministicRoomSalt(roomId));

        const payload: EncryptedMessagePayload = {
          id: messageId,
          roomId,
          senderId: userId,
          senderName: userName,
          ciphertext,
          iv,
          authTag,
          keyFingerprint: fingerprintHex.substring(0, 8),
          salt: bufferToBase64(salt),
          timestamp: Date.now(),
          timerSeconds,
          isBurnAfterReading,
          mediaType,
        };

        // 1. Optimistic local update with already-known plaintext
        const optimisticMsg: DecryptedMessage = {
          ...payload,
          plaintext: content,
          decryptionError: false,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === messageId)) return prev;
          return [...prev, optimisticMsg];
        });

        // 2. BroadcastChannel dispatch for instant local tab / split-view sync
        if (typeof BroadcastChannel !== 'undefined') {
          const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
          const bc = new BroadcastChannel(channelName);
          bc.postMessage({
            type: 'new_message',
            roomId,
            message: payload,
          });
          bc.close();
        }

        // 3. Send to WebSocket server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'send_message',
              roomId,
              message: payload,
            })
          );
        }

        playSendSound(soundEnabled);
      } catch (err) {
        console.error('Failed to encrypt and send message:', err);
      } finally {
        setIsEncrypting(false);
      }
    },
    [roomId, userId, userName, fingerprintHex, soundEnabled]
  );

  // Trigger Burn Reveal
  const revealBurnMessage = useCallback(
    (messageId: string, countdownSeconds = 10) => {
      const now = Date.now();
      const expiresAt = now + countdownSeconds * 1000;

      // Local state update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                burnRevealedAt: now,
                burnCountdown: countdownSeconds,
                expiresAt,
              }
            : m
        )
      );

      // BroadcastChannel notify
      if (typeof BroadcastChannel !== 'undefined') {
        const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
        const bc = new BroadcastChannel(channelName);
        bc.postMessage({
          type: 'burn_countdown_started',
          roomId,
          messageId,
          burnRevealedAt: now,
          countdownSeconds,
          expiresAt,
        });
        bc.close();
      }

      // WebSocket notify
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'burn_reveal',
            roomId,
            messageId,
            countdownSeconds,
          })
        );
      }
    },
    [roomId]
  );

  // Manual Shred
  const shredMessage = useCallback(
    (messageId: string) => {
      // Local wipe
      playShredSound(soundEnabled);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      // BroadcastChannel notify
      if (typeof BroadcastChannel !== 'undefined') {
        const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
        const bc = new BroadcastChannel(channelName);
        bc.postMessage({
          type: 'message_destroyed',
          roomId,
          messageId,
          reason: 'manual_shred',
        });
        bc.close();
      }

      // WebSocket notify
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'shred_message',
            roomId,
            messageId,
          })
        );
      }
    },
    [roomId, soundEnabled]
  );

  // Panic Purge Room
  const purgeRoom = useCallback(() => {
    playShredSound(soundEnabled);
    setMessages([]);

    if (typeof BroadcastChannel !== 'undefined') {
      const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
      const bc = new BroadcastChannel(channelName);
      bc.postMessage({
        type: 'room_purged',
        roomId,
      });
      bc.close();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'purge_room',
          roomId,
        })
      );
    }
  }, [roomId, soundEnabled]);

  // Video / Audio Call Handlers
  const startCall = useCallback(
    (isVideo = true) => {
      setActiveCall({
        peerId: 'peer',
        peerName: 'Teman Obrolan',
        isVideo,
      });

      const callPayload = {
        type: 'call_request',
        roomId,
        callerId: userId,
        callerName: userName,
        isVideo,
      };

      if (typeof BroadcastChannel !== 'undefined') {
        const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
        const bc = new BroadcastChannel(channelName);
        bc.postMessage({
          type: 'incoming_call',
          roomId,
          callerId: userId,
          callerName: userName,
          isVideo,
        });
        bc.close();
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(callPayload));
      }
    },
    [roomId, userId, userName]
  );

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;

    setActiveCall({
      peerId: incomingCall.callerId,
      peerName: incomingCall.callerName,
      isVideo: incomingCall.isVideo,
    });
    setIncomingCall(null);

    const acceptPayload = {
      type: 'call_accepted',
      roomId,
      callerId: incomingCall.callerId,
      recipientId: userId,
      recipientName: userName,
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
      const bc = new BroadcastChannel(channelName);
      bc.postMessage(acceptPayload);
      bc.close();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(acceptPayload));
    }
  }, [incomingCall, roomId, userId, userName]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    const callerId = incomingCall.callerId;
    setIncomingCall(null);
    playCallEndSound(soundEnabled);

    const rejectPayload = {
      type: 'call_rejected',
      roomId,
      callerId,
      recipientId: userId,
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
      const bc = new BroadcastChannel(channelName);
      bc.postMessage(rejectPayload);
      bc.close();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(rejectPayload));
    }
  }, [incomingCall, roomId, userId, soundEnabled]);

  const endCall = useCallback(() => {
    setActiveCall(null);
    setIncomingCall(null);
    playCallEndSound(soundEnabled);

    const endPayload = {
      type: 'call_ended',
      roomId,
      userId,
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const channelName = `aegiscrypt_channel_${roomId.trim().toLowerCase()}`;
      const bc = new BroadcastChannel(channelName);
      bc.postMessage(endPayload);
      bc.close();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(endPayload));
    }
  }, [roomId, userId, soundEnabled]);

  return {
    messages,
    participants,
    isConnected,
    isEncrypting,
    sendMessage,
    revealBurnMessage,
    shredMessage,
    purgeRoom,
    safetyNumber,
    fingerprintHex,
    saltHex,
    incomingCall,
    activeCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
