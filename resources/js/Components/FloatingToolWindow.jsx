import React, { useRef, useState } from 'react';

/**
 * A small movable window for student tools (calculator, kamus). Opens near
 * the top-right, drags by its header with a mouse or finger, never leaves the
 * screen, and scrolls inside only when the screen is shorter than the tool.
 *
 * stack: 0, 1, ... nudges each extra open tool down-left so they don't cover each other.
 */
export default function FloatingToolWindow({ title, icon, onClose, children, width = 288, stack = 0 }) {
  const windowRef = useRef(null);
  const drag = useRef(null);

  const clamp = (x, y) => {
    const currentWidth = windowRef.current?.offsetWidth ?? width;
    return {
      x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - currentWidth - 8)),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - 56)),
    };
  };

  const [position, setPosition] = useState(() => clamp(window.innerWidth - width - 16 - stack * 32, 80 + stack * 32));

  return (
    <div ref={windowRef} className="fixed z-50" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
      <div className="overflow-hidden rounded-lg bg-slate-900 shadow-2xl ring-1 ring-black/20">
        <div
          className="flex cursor-move items-center justify-between gap-2 bg-slate-800 px-2.5 py-1 text-white"
          style={{ touchAction: 'none' }}
          onPointerDown={(event) => {
            if (event.target.closest('button')) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const rect = windowRef.current.getBoundingClientRect();
            drag.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setPosition(clamp(event.clientX - drag.current.x, event.clientY - drag.current.y));
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            <h3 className="truncate text-xs font-semibold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            title="Close"
            aria-label={`Close ${title}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
