import React, { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

// "TEMA 1 : KAEDAH SAINTIFIK" -> "Tema 1: Kaedah Saintifik". Titles that are
// already mixed case are left alone so acronyms (SPM, DNA) keep their capitals.
const readableTitle = (text = '') => {
  const tidy = text.replace(/\s+:\s*/g, ': ').trim();
  if (tidy !== tidy.toUpperCase() || !/[A-Z]/.test(tidy)) return tidy;
  return tidy.toLowerCase().replace(/(^|\s)(\p{L})/gu, (match, space, letter) => space + letter.toUpperCase());
};

/**
 * Header for the objective and subjective question pages: back button, title,
 * topic and timer on the first row; the question dots underneath (they scroll
 * sideways when there are many); a thin progress bar in the theme colour.
 * It scrolls away with the page rather than staying pinned.
 *
 * statuses: one entry per question, true = correct first try,
 * false = wrong first try, null = not answered yet.
 */
export default function QuestionHeader({ title, topic, statuses = [], current = 0, timeText, timeClass = 'text-slate-600', onBack, backLabel = 'Back' }) {
  const { auth, topic_id, parent_topic_id } = usePage().props;
  const showDevelopmentIds = auth?.user?.email === 'tasya@children.hometutor.local';
  const dotsRef = useRef(null);
  const total = statuses.length;
  const answered = statuses.filter((status) => status !== null && status !== undefined).length;

  // Keep the current dot visible in the scrolling row. Only the row scrolls,
  // never the page.
  useEffect(() => {
    const row = dotsRef.current;
    const dot = row?.children[current];
    if (!row || !dot) return;
    const left = dot.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + dot.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: left - row.clientWidth / 2 + dot.offsetWidth / 2, behavior: 'smooth' });
    }
  }, [current, total]);

  return (
    <header className="student-theme-question-header border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pt-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          title={backLabel}
          aria-label={backLabel}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-rose-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-800 sm:text-lg" title={title}>{readableTitle(title)}</h1>
          {topic && <p className="truncate text-xs text-slate-500 sm:text-sm" title={topic}>{topic}</p>}
          {showDevelopmentIds && topic_id && <p className="mt-1 font-mono text-xs text-amber-800">
            {parent_topic_id ? `ID topik: ${parent_topic_id} · ID subtopik: ${topic_id}` : `ID topik: ${topic_id}`}
          </p>}
        </div>

        {timeText && (
          <span className={`flex flex-none items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold tabular-nums ${timeClass}`} title="Time elapsed">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeText}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <div ref={dotsRef} className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statuses.map((status, index) => {
              const isCurrent = index === current;
              const tone = status === true
                ? 'bg-emerald-500 text-white'
                : status === false
                  ? 'bg-rose-500 text-white'
                  : isCurrent ? 'bg-white' : 'bg-slate-100 text-slate-500';
              return (
                <span
                  key={index}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold transition ${tone}`}
                  style={isCurrent ? { boxShadow: '0 0 0 2px var(--theme-accent)', ...(status == null ? { color: 'var(--theme-accent)' } : {}) } : undefined}
                >
                  {index + 1}
                </span>
              );
            })}
          </div>
          <span className="flex-none text-xs font-semibold text-slate-500">Soalan {Math.min(current + 1, total)}/{total}</span>
        </div>
      )}

      {total > 0 && (
        <div className="h-1 bg-slate-100">
          <div className="h-full transition-all duration-500" style={{ width: `${(answered / total) * 100}%`, background: 'var(--theme-accent)' }} />
        </div>
      )}
    </header>
  );
}
