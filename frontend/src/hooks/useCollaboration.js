import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";

function resolveWebSocketUrl(docId, token, clientId) {
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
  }
  if (typeof window !== "undefined") {
    const isDevPort = ["5173", "5174", "5175", "5176", "3000"].includes(window.location.port);
    const host = window.location.hostname;
    const port = isDevPort ? ":8000" : (window.location.port ? `:${window.location.port}` : "");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${host}${port}/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
  }
  return `ws://127.0.0.1:8000/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
}

function uint8ToBase64(arr) {
  let binary = "";
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function deduplicateUsers(users = []) {
  const seen = new Set();
  const result = [];
  for (const u of users) {
    if (!u) continue;
    const key = u.user_id ? `uid_${u.user_id}` : `cid_${u.client_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(u);
    }
  }
  return result;
}

export function useCollaboration(docId, onRemoteDraw, onRemoteComment) {
  const [initialContent, setInitialContent] = useState("");
  const [drawingData, setDrawingData] = useState("[]");
  const [version, setVersion] = useState(0);
  const [activeUsers, setActiveUsers] = useState([]);
  const [userRole, setUserRole] = useState("editor");
  const [myColor, setMyColor] = useState("#6366f1");
  const [remoteCursors, setRemoteCursors] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [typingUsers, setTypingUsers] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // Single persistent Yjs Document instance and persistent Client ID per tab session
  const yjsDocRef = useRef(new Y.Doc());
  const clientIdRef = useRef("client_" + Math.random().toString(36).substring(2, 8));
  const wsRef = useRef(null);
  const drawCallbackRef = useRef(onRemoteDraw);
  const commentCallbackRef = useRef(onRemoteComment);
  const reconnectTimeoutRef = useRef(null);
  const backoffRef = useRef(1000);
  const isMountedRef = useRef(true);

  drawCallbackRef.current = onRemoteDraw;
  commentCallbackRef.current = onRemoteComment;

  // Listen to local Yjs updates and send over WebSocket
  useEffect(() => {
    const ydoc = yjsDocRef.current;
    const handleUpdate = (update, origin) => {
      if (origin !== "remote" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          const b64 = uint8ToBase64(update);
          wsRef.current.send(
            JSON.stringify({
              type: "yjs_update",
              update: b64,
            })
          );
        } catch (e) {
          console.warn("Failed to serialize Yjs update:", e);
        }
      }
    };

    ydoc.on("update", handleUpdate);
    return () => {
      ydoc.off("update", handleUpdate);
    };
  }, []);

  // WebSocket lifecycle with auto-reconnection
  useEffect(() => {
    isMountedRef.current = true;
    const token = localStorage.getItem("token");
    if (!token || !docId) return;

    let ws = null;

    const connect = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus("connecting");
      const wsUrl = resolveWebSocketUrl(docId, token, clientIdRef.current);

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setConnectionStatus("connected");
          backoffRef.current = 1000; // Reset backoff on successful connect
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case "sync_init":
                setInitialContent(data.content || "");
                setDrawingData(data.drawing_data || "[]");
                setVersion(data.version || 0);
                setUserRole(data.user_role || "editor");
                setMyColor(data.user_color || "#6366f1");
                setActiveUsers(deduplicateUsers(data.active_users || []));
                setConnectionStatus("connected");
                setIsReady(true);
                break;

              case "yjs_broadcast":
                if (data.update) {
                  try {
                    const bytes = base64ToUint8(data.update);
                    Y.applyUpdate(yjsDocRef.current, bytes, "remote");
                  } catch (err) {
                    console.warn("Failed to apply remote Yjs update:", err);
                  }
                }
                break;

              case "presence_join":
                if (data.active_users) {
                  setActiveUsers(deduplicateUsers(data.active_users));
                } else if (data.user) {
                  setActiveUsers((prev) => deduplicateUsers([...prev, data.user]));
                }
                break;

              case "presence_leave":
                if (data.active_users) {
                  setActiveUsers(deduplicateUsers(data.active_users));
                } else if (data.client_id || data.user_id) {
                  setActiveUsers((prev) =>
                    prev.filter(
                      (u) =>
                        u.client_id !== data.client_id &&
                        u.user_id !== data.user_id
                    )
                  );
                }
                break;

              case "cursor_update":
                setRemoteCursors((prev) => ({
                  ...prev,
                  [data.client_id]: {
                    userId: data.user_id,
                    cursor: data.cursor,
                    selection: data.selection,
                    isTyping: data.is_typing,
                  },
                }));

                if (data.is_typing) {
                  setTypingUsers((prev) => {
                    const found = data.user_id;
                    return prev.includes(found) ? prev : [...prev, found];
                  });
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      setTypingUsers((prev) => prev.filter((id) => id !== data.user_id));
                    }
                  }, 2500);
                }
                break;

              case "draw_broadcast":
                if (data.elements) {
                  setDrawingData(typeof data.elements === "string" ? data.elements : JSON.stringify(data.elements));
                }
                if (drawCallbackRef.current) {
                  drawCallbackRef.current(data);
                }
                break;

              case "comment_broadcast":
                if (commentCallbackRef.current) {
                  commentCallbackRef.current(data);
                }
                break;

              case "error":
                console.warn("WebSocket server notification:", data.message);
                break;
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        ws.onerror = () => {
          if (isMountedRef.current) {
            setConnectionStatus("disconnected");
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setConnectionStatus("disconnected");
          // Schedule auto-reconnect with exponential backoff (max 10s)
          const delay = backoffRef.current;
          backoffRef.current = Math.min(delay * 1.5, 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) connect();
          }, delay);
        };
      } catch (err) {
        console.error("Failed to create WebSocket:", err);
        setConnectionStatus("disconnected");
      }
    };

    connect();

    // Heartbeat ping every 25s
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeoutRef.current);
      if (ws) {
        ws.close();
      }
    };
  }, [docId]);

  const sendCursor = useCallback((index, isTyping = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "cursor",
          cursor: { index },
          is_typing: isTyping,
        })
      );
    }
  }, []);

  const sendDraw = useCallback((drawPayload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "draw",
          ...drawPayload,
        })
      );
    }
  }, []);

  const sendCommentEvent = useCallback((commentPayload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "comment_event",
          ...commentPayload,
        })
      );
    }
  }, []);

  const syncHtmlContent = useCallback((html) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "yjs_update",
          html,
        })
      );
    }
  }, []);

  return {
    yjsDoc: yjsDocRef.current,
    initialContent,
    drawingData,
    setDrawingData,
    version,
    userRole,
    myColor,
    activeUsers,
    remoteCursors,
    typingUsers,
    connectionStatus,
    isReady,
    sendCursor,
    sendDraw,
    sendCommentEvent,
    syncHtmlContent,
  };
}
