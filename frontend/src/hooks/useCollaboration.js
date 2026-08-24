import { useEffect, useRef, useState, useCallback } from "react";

export function useCollaboration(docId) {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [activeUsers, setActiveUsers] = useState([]);
  const [userRole, setUserRole] = useState("editor");
  const [myColor, setMyColor] = useState("#2563eb");
  const [remoteCursors, setRemoteCursors] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // "connected" | "connecting" | "disconnected"
  const wsRef = useRef(null);
  const contentRef = useRef(content);
  const versionRef = useRef(version);

  contentRef.current = content;
  versionRef.current = version;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !docId) return;

    setConnectionStatus("connecting");
    const clientId = "client_" + Math.random().toString(36).substring(2, 8);
    const wsUrl = `ws://localhost:8000/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
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
            setVersion(data.version || 0);
            setUserRole(data.user_role || "editor");
            setMyColor(data.user_color || "#2563eb");
            setActiveUsers(data.active_users || []);
            break;

          case "operation_broadcast":
            const op = data.operation;
            setContent((prev) => {
              let nextContent = prev;
              if (op.op_type === "insert") {
                const pos = Math.max(0, Math.min(op.position, prev.length));
                nextContent = prev.slice(0, pos) + op.text + prev.slice(pos);
              } else if (op.op_type === "delete") {
                const pos = Math.max(0, Math.min(op.position, prev.length));
                nextContent = prev.slice(0, pos) + prev.slice(pos + op.length);
              } else if (op.op_type === "replace") {
                nextContent = op.text;
              }
              return nextContent;
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
            break;

          case "sync_recovery":
            setContent(data.current_content);
            setVersion(data.current_version);
            break;
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
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

  return {
    content,
    setContent,
    version,
    userRole,
    myColor,
    activeUsers,
    remoteCursors,
    connectionStatus,
    sendOperation,
    sendCursor,
  };
}
