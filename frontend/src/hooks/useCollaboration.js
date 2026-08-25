import { useEffect, useRef, useState, useCallback } from "react";

function resolveWebSocketUrl(docId, token, clientId) {
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
  }
  if (typeof window !== "undefined") {
    const isDevPort = window.location.port === "5173" || window.location.port === "3000";
    const portStr = isDevPort ? ":8000" : (window.location.port ? `:${window.location.port}` : "");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}${portStr}/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
  }
  return `ws://127.0.0.1:8000/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
}

export function useCollaboration(docId, onRemoteDraw, onRemoteComment) {
  const [content, setContent] = useState("");
  const [drawingData, setDrawingData] = useState("[]");
  const [version, setVersion] = useState(0);
  const [activeUsers, setActiveUsers] = useState([]);
  const [userRole, setUserRole] = useState("editor");
  const [myColor, setMyColor] = useState("#2563eb");
  const [remoteCursors, setRemoteCursors] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [typingUsers, setTypingUsers] = useState([]);
  const wsRef = useRef(null);
  const contentRef = useRef(content);
  const versionRef = useRef(version);
  const drawCallbackRef = useRef(onRemoteDraw);
  const commentCallbackRef = useRef(onRemoteComment);

  drawCallbackRef.current = onRemoteDraw;
  commentCallbackRef.current = onRemoteComment;
  contentRef.current = content;
  versionRef.current = version;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !docId) return;

    setConnectionStatus("connecting");
    const clientId = "client_" + Math.random().toString(36).substring(2, 8);
    const wsUrl = resolveWebSocketUrl(docId, token, clientId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "sync_init":
            setContent(data.content || "");
            setDrawingData(data.drawing_data || "[]");
            setVersion(data.version || 0);
            setUserRole(data.user_role || "editor");
            setMyColor(data.user_color || "#2563eb");
            setActiveUsers(data.active_users || []);
            setConnectionStatus("connected");
            break;

          case "operation_broadcast":
            const op = data.operation;
            setContent((prev) => {
              if (op.op_type === "replace") {
                return op.text;
              } else if (op.op_type === "insert") {
                const pos = Math.max(0, Math.min(op.position, prev.length));
                return prev.slice(0, pos) + op.text + prev.slice(pos);
              } else if (op.op_type === "delete") {
                const pos = Math.max(0, Math.min(op.position, prev.length));
                return prev.slice(0, pos) + prev.slice(pos + op.length);
              }
              return prev;
            });
            setVersion(data.version);
            break;

          case "operation_ack":
            setVersion(data.server_version);
            break;

          case "presence_join":
          case "presence_leave":
            setActiveUsers(data.active_users || []);
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
                setTypingUsers((prev) => prev.filter((id) => id !== data.user_id));
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

          case "sync_recovery":
            setContent(data.current_content);
            if (data.drawing_data) setDrawingData(data.drawing_data);
            setVersion(data.current_version);
            break;

          case "error":
            console.error("Server WS error:", data.message);
            break;
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = () => {
      setConnectionStatus("disconnected");
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [docId]);

  const sendOperation = useCallback((op) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "operation",
          operation: {
            ...op,
            client_version: versionRef.current,
          },
        })
      );
    }
  }, []);

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

  return {
    content,
    setContent,
    drawingData,
    setDrawingData,
    version,
    userRole,
    myColor,
    activeUsers,
    remoteCursors,
    typingUsers,
    connectionStatus,
    sendOperation,
    sendCursor,
    sendDraw,
    sendCommentEvent,
  };
}
