import { useState } from 'react';
import { barPath, niceMax, vizTokens } from '@/utils/parentChartTokens';

const WIDTH = 720;
const HEIGHT = 230;
const PAD = { top: 18, right: 10, bottom: 30, left: 38 };

/**
 * Questions answered per day across the reporting window. One series, so the
 * heading names what is plotted and no legend box is needed; only the busiest
 * day carries a direct label, the rest are in the hover tooltip and the table.
 */
export default function QuestionsPerDayChart({ days = [], windowDays = 30 }) {
    const [hovered, setHovered] = useState(null);
    const [showTable, setShowTable] = useState(false);

    const total = days.reduce((sum, day) => sum + day.questions, 0);
    const busiest = days.reduce((best, day) => (day.questions > (best?.questions ?? 0) ? day : best), null);
    const activeDays = days.filter((day) => day.questions > 0).length;

    const plotWidth = WIDTH - PAD.left - PAD.right;
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;
    const baseline = PAD.top + plotHeight;
    const max = niceMax(busiest?.questions ?? 0);
    const band = plotWidth / Math.max(days.length, 1);
    const barWidth = Math.min(24, Math.max(band - 2, 2));
    const ticks = [0, max / 2, max];

    const xOf = (index) => PAD.left + index * band + (band - barWidth) / 2;
    const yOf = (value) => baseline - (value / max) * plotHeight;

    if (! days.length) {
        return <EmptyState message="No learning sessions recorded yet." />;
    }

    return (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(8,44,88,0.07)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0788c9]">Daily effort</p>
                    <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#082c58] sm:text-xl">
                        Questions answered per day
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {total} answered over the last {windowDays} days · active on {activeDays}{' '}
                        {activeDays === 1 ? 'day' : 'days'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowTable((open) => ! open)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                    {showTable ? 'Show chart' : 'Show numbers'}
                </button>
            </div>

            {showTable ? (
                <div className="mt-5 max-h-72 overflow-y-auto rounded-xl border border-slate-100">
                    <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2.5 font-bold">Date</th>
                                <th className="px-4 py-2.5 text-right font-bold">Questions answered</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[...days].reverse().map((day) => (
                                <tr key={day.date} className={day.questions ? '' : 'text-slate-400'}>
                                    <td className="px-4 py-2.5 font-semibold">
                                        {day.weekday}, {day.label}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">{day.questions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="relative mt-5">
                    <svg
                        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        className="w-full"
                        role="img"
                        aria-label={`Questions answered per day over the last ${windowDays} days. Total ${total}.`}
                    >
                        {ticks.map((tick) => (
                            <g key={tick}>
                                <line
                                    x1={PAD.left}
                                    x2={WIDTH - PAD.right}
                                    y1={yOf(tick)}
                                    y2={yOf(tick)}
                                    stroke={tick === 0 ? vizTokens.axis : vizTokens.grid}
                                    strokeWidth="1"
                                />
                                <text
                                    x={PAD.left - 8}
                                    y={yOf(tick) + 4}
                                    textAnchor="end"
                                    fontSize="11"
                                    fill={vizTokens.textMuted}
                                    className="tabular-nums"
                                >
                                    {tick}
                                </text>
                            </g>
                        ))}

                        {days.map((day, index) => {
                            const height = day.questions ? Math.max(baseline - yOf(day.questions), 2) : 0;

                            return (
                                <g key={day.date}>
                                    {height > 0 && (
                                        <path
                                            d={barPath(xOf(index), baseline - height, barWidth, height)}
                                            fill={vizTokens.series}
                                            opacity={hovered === null || hovered === index ? 1 : 0.55}
                                        />
                                    )}
                                    {/* Hit target spans the full band height, not just the bar. */}
                                    <rect
                                        x={PAD.left + index * band}
                                        y={PAD.top}
                                        width={band}
                                        height={plotHeight}
                                        fill="transparent"
                                        onMouseEnter={() => setHovered(index)}
                                        onMouseLeave={() => setHovered(null)}
                                    />
                                </g>
                            );
                        })}

                        {busiest?.questions > 0 && (
                            <text
                                x={xOf(days.indexOf(busiest)) + barWidth / 2}
                                y={yOf(busiest.questions) - 7}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="700"
                                fill={vizTokens.textPrimary}
                            >
                                {busiest.questions}
                            </text>
                        )}

                        {days.map((day, index) =>
                            index % 5 === 0 || index === days.length - 1 ? (
                                <text
                                    key={`tick-${day.date}`}
                                    x={xOf(index) + barWidth / 2}
                                    y={HEIGHT - 10}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill={vizTokens.textMuted}
                                >
                                    {day.label}
                                </text>
                            ) : null,
                        )}
                    </svg>

                    {hovered !== null && days[hovered] && (
                        <div
                            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white shadow-lg"
                            style={{
                                left: `${((PAD.left + hovered * band + band / 2) / WIDTH) * 100}%`,
                                top: `${(yOf(days[hovered].questions) / HEIGHT) * 100}%`,
                            }}
                        >
                            <span className="block text-[11px] font-medium text-slate-300">
                                {days[hovered].weekday}, {days[hovered].label}
                            </span>
                            {days[hovered].questions} answered
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function EmptyState({ message }) {
    return (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(8,44,88,0.07)]">
            <h2 className="text-lg font-extrabold tracking-tight text-[#082c58]">Questions answered per day</h2>
            <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-400">
                {message}
            </p>
        </section>
    );
}
