import React, { useEffect, useState } from 'react';
import ScientificCalculator from '@/Components/ScientificCalculator';
import Dictionary from '@/Components/Dictionary';
import FloatingToolWindow from '@/Components/FloatingToolWindow';

const ICONS = {
  tools: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  calculator: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  dictionary: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};

const TOOLS = [
  { key: 'calculator', label: 'Calculator' },
  { key: 'dictionary', label: 'Kamus' },
  // "Draw on Page" (PageDrawingTool) and "Add Note" (AutoNotes) stay hidden until
  // they are fixed: the eraser paints white, drawing needs a mouse and blocks the
  // answers, and reopening Add Note wipes saved notes.
];

/**
 * The Tools menu for the objective and subjective question pages.
 *
 * It is a hook rather than a component because the pages rebuild their footer
 * on every timer tick: keeping the open/closed state here (in the page) means
 * the menu and the tool windows stay open while the footer re-renders.
 *
 * Returns { toolsButton, toolWindows }: put toolsButton in the footer and
 * toolWindows anywhere in the page.
 */
export function useQuestionTools() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState({ calculator: false, dictionary: false });

  const openTool = (key) => {
    setOpen((current) => ({ ...current, [key]: true }));
    setMenuOpen(false);
  };
  const closeTool = (key) => setOpen((current) => ({ ...current, [key]: false }));

  // Close the menu on an outside click; Escape closes the menu and any tool window.
  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuOpen && !event.target.closest('[data-question-tools]')) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      setOpen({ calculator: false, dictionary: false });
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const toolsButton = (
    <div className="relative" data-question-tools>
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        aria-expanded={menuOpen}
        aria-label="Tools"
        className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-700 px-3 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 sm:px-4"
      >
        {ICONS.tools}
        <span className="hidden sm:inline">Tools</span>
      </button>

      {menuOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => openTool(tool.key)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-slate-700 transition-colors hover:bg-slate-100"
            >
              <span className="text-slate-500">{ICONS[tool.key]}</span>
              {tool.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const toolWindows = (
    <>
      {open.calculator && (
        <FloatingToolWindow title="Scientific Calculator" icon={ICONS.calculator} onClose={() => closeTool('calculator')}>
          <ScientificCalculator />
        </FloatingToolWindow>
      )}
      {open.dictionary && (
        <FloatingToolWindow title="Kamus" icon={ICONS.dictionary} width={320} stack={open.calculator ? 1 : 0} onClose={() => closeTool('dictionary')}>
          <Dictionary />
        </FloatingToolWindow>
      )}
    </>
  );

  return { toolsButton, toolWindows };
}
