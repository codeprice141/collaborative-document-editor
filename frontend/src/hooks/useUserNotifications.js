import { useEffect, useRef } from 'react';
import { playNotificationChime } from '../utils/audio';

function resolveNotificationWsUrl(token) {
  if (import.meta.env.VITE_WS_URL) {
    const base = import.meta.env.VITE_WS_URL.replace(/\/$/, '');
    return `${base}/api/v1/ws/notifications?token=${token}`;
  }
  if (import.meta.env.VITE_API_BASE) {
    try {
      const apiUrl = new URL(import.meta.env.VITE_API_BASE);
      const wsProto = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      const cleanPath = apiUrl.pathname.replace(/\/api\/v1\/?$/, '');
      return `${wsProto}//${apiUrl.host}${cleanPath}/api/v1/ws/notifications?token=${token}`;
    } catch (e) {
      console.warn('Failed to derive notification WS URL:', e);
    }
  }
  if (typeof window !== 'undefined') {
    const isDevPort = ['5173', '5174', '5175', '5176', '3000'].includes(window.location.port);
    const host = window.location.hostname;
    const port = isDevPort ? ':8000' : (window.location.port ? `:${window.location.port}` : '');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${host}${port}/api/v1/ws/notifications?token=${token}`;
  }
  return `ws://127.0.0.1:8000/api/v1/ws/notifications?token=${token}`;
}

export function useUserNotifications({ onDocumentShared, onMention } = {}) {
  const wsRef = useRef(null);
  const backoffRef = useRef(1000);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const onDocSharedRef = useRef(onDocumentShared);
  onDocSharedRef.current = onDocumentShared;

  const onMentionRef = useRef(onMention);
  onMentionRef.current = onMention;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      try {
        const url = resolveNotificationWsUrl(token);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          backoffRef.current = 1000;
          // Ping keepalive every 25s
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isMounted || event.data === 'pong') return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'document_shared') {
              playNotificationChime();
              onDocSharedRef.current?.(data);
            } else if (data.type === 'mention_notification') {
              playNotificationChime();
              onMentionRef.current?.(data);
            }
          } catch (err) {
            console.debug('User notification parse error:', err);
          }
        };

        ws.onclose = () => {
          clearInterval(pingIntervalRef.current);
          if (!isMounted) return;
          const delay = backoffRef.current;
          backoffRef.current = Math.min(delay * 1.5, 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, delay);
        };

        ws.onerror = () => {
          try { ws.close(); } catch { /* silent */ }
        };
      } catch (err) {
        console.debug('Notification socket creation error:', err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* silent */ }
      }
    };
  }, []);
}
