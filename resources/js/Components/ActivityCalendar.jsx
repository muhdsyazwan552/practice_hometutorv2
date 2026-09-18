import React, { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const PRACTICE_COLOR = '#22c55e';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function buildDateKey(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function MonthGrid({ month, loginSet, practiceSet, todayKey }) {
  const cells = useMemo(() => {
    const list = [];
    for (let i = 0; i < month.firstWeekday; i += 1) {
      list.push(null);
    }
    for (let day = 1; day <= month.daysInMonth; day += 1) {
      list.push(day);
    }
    return list;
  }, [month]);

  return (
    <div
      className="rounded-[28px] border-[3px] p-4 sm:p-5"
      style={{
        borderColor: 'color-mix(in srgb, var(--theme-accent) 30%, white)',
        background: 'color-mix(in srgb, var(--theme-card, #ffffff) 92%, var(--theme-accent) 8%)',
        boxShadow: '0 12px 28px color-mix(in srgb, var(--theme-accent) 16%, transparent)',
      }}
    >
      <div className="grid grid-cols-7 justify-items-center gap-1.5 text-center text-[11px] font-extrabold uppercase" style={{ color: 'color-mix(in srgb, var(--theme-accent) 70%, #475569)' }}>
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${month.year}-${month.month}-wd-${index}`}>{label}</span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 items-center justify-items-center gap-1.5 sm:gap-2">
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} />;
          }
          const dateKey = buildDateKey(month.year, month.month, day);
          const loggedIn = loginSet.has(dateKey);
          const practised = practiceSet.has(dateKey);
          const isToday = dateKey === todayKey;

          let cellStyle = {
            background: 'color-mix(in srgb, var(--theme-accent) 8%, white)',
            color: '#475569',
            border: '1.5px solid color-mix(in srgb, var(--theme-accent) 18%, white)',
          };
          if (loggedIn && practised) {
            cellStyle = {
              background: `linear-gradient(135deg, var(--theme-accent), ${PRACTICE_COLOR})`,
              color: '#ffffff',
              border: '1.5px solid rgba(255,255,255,.6)',
              boxShadow: '0 6px 14px color-mix(in srgb, var(--theme-accent) 45%, transparent)',
            };
          } else if (practised) {
            cellStyle = { background: PRACTICE_COLOR, color: '#ffffff', border: '1.5px solid rgba(255,255,255,.6)', boxShadow: `0 6px 14px ${PRACTICE_COLOR}55` };
          } else if (loggedIn) {
            cellStyle = {
              background: 'var(--theme-accent)',
              color: '#ffffff',
              border: '1.5px solid rgba(255,255,255,.6)',
              boxShadow: '0 6px 14px color-mix(in srgb, var(--theme-accent) 45%, transparent)',
            };
          }

          return (
            <span key={dateKey} className="relative">
              {isToday && (
                <SparklesIcon
                  className="absolute -right-1.5 -top-2 h-3.5 w-3.5 animate-bounce"
                  style={{ color: '#f59e0b' }}
                />
              )}
              <span
                title={`${dateKey}${loggedIn ? ' · login' : ''}${practised ? ' · practice' : ''}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-transform duration-200 hover:scale-110 sm:h-10 sm:w-10 ${
                  isToday ? 'ring-[3px] ring-offset-2' : ''
                }`}
                style={{ ...cellStyle, ...(isToday ? { '--tw-ring-color': '#f59e0b' } : {}) }}
              >
                {day}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function ActivityCalendar({ months = [], loginDates = [], practiceDates = [] }) {
  const loginSet = useMemo(() => new Set(loginDates), [loginDates]);
  const practiceSet = useMemo(() => new Set(practiceDates), [practiceDates]);
  const todayKey = useMemo(() => {
    const now = new Date();
    return buildDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  // months come oldest -> newest; default to the latest (current) month.
  const [activeIndex, setActiveIndex] = useState(Math.max(0, months.length - 1));

  if (!months.length) return null;

  const activeMonth = months[activeIndex] ?? months[months.length - 1];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < months.length - 1;

  const pillBorder = { borderColor: 'color-mix(in srgb, var(--theme-accent) 35%, white)' };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        {canGoPrev ? (
          <button
            type="button"
            onClick={() => setActiveIndex((index) => index - 1)}
            className="flex items-center gap-1 rounded-full border-2 bg-white px-3.5 py-1.5 text-xs font-bold transition-transform hover:scale-105 active:scale-95"
            style={{ ...pillBorder, color: 'var(--theme-accent)' }}
          >
            <ChevronLeftIcon className="h-4 w-4" /> Bulan lepas
          </button>
        ) : <span />}
        <p className="rounded-full px-4 py-1 text-sm font-extrabold" style={{ background: 'color-mix(in srgb, var(--theme-accent) 12%, white)', color: 'var(--theme-accent)' }}>
          {activeMonth.label}
        </p>
        {canGoNext ? (
          <button
            type="button"
            onClick={() => setActiveIndex((index) => index + 1)}
            className="flex items-center gap-1 rounded-full border-2 bg-white px-3.5 py-1.5 text-xs font-bold transition-transform hover:scale-105 active:scale-95"
            style={{ ...pillBorder, color: 'var(--theme-accent)' }}
          >
            Bulan depan <ChevronRightIcon className="h-4 w-4" />
          </button>
        ) : <span />}
      </div>

      <MonthGrid month={activeMonth} loginSet={loginSet} practiceSet={practiceSet} todayKey={todayKey} />

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold" style={{ color: '#64748b' }}>
        <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ background: 'var(--theme-accent)' }} /> Log masuk</span>
        <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ background: PRACTICE_COLOR }} /> Buat latihan</span>
        <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ background: `linear-gradient(135deg, var(--theme-accent), ${PRACTICE_COLOR})` }} /> Log masuk &amp; latihan</span>
        <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-full ring-2 ring-offset-1" style={{ '--tw-ring-color': '#f59e0b' }} /> Hari ini</span>
      </div>
    </div>
  );
}
