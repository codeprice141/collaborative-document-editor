import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

export default function ExcalidrawBoard({
  initialData,
  onSave,
  onSendDraw,
  registerListener,
  isReadOnly = false,
  isDark = false,
}) {
  const excalidrawApiRef = useRef(null);
  const saveTimer = useRef(null);

  // Parse initial data
  const getInitialElements = () => {
    try {
      if (!initialData || initialData === '[]') return [];
      const parsed = typeof initialData === 'string' ? JSON.parse(initialData) : initialData;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  // Register listener for remote draw events
  useEffect(() => {
    if (!registerListener) return;
    registerListener((payload) => {
      if (payload.elements && excalidrawApiRef.current) {
        try {
          const elements = typeof payload.elements === 'string'
            ? JSON.parse(payload.elements)
            : payload.elements;
          if (Array.isArray(elements)) {
            excalidrawApiRef.current.updateScene({ elements });
          }
        } catch { /* ignore malformed remote events */ }
      }
    });
  }, [registerListener]);

  const handleChange = useCallback((elements) => {
    if (isReadOnly) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const json = JSON.stringify(elements);
      if (onSave) onSave(json);
      if (onSendDraw) onSendDraw({ elements });
    }, 500);
  }, [isReadOnly, onSave, onSendDraw]);

  return (
    <div className="w-full h-full">
      <Excalidraw
        excalidrawAPI={(api) => { excalidrawApiRef.current = api; }}
        initialData={{
          elements: getInitialElements(),
          appState: {
            viewBackgroundColor: isDark ? '#0f172a' : '#f8fafc',
            theme: isDark ? 'dark' : 'light',
          },
        }}
        onChange={(elements) => handleChange(elements)}
        viewModeEnabled={isReadOnly}
        theme={isDark ? 'dark' : 'light'}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
