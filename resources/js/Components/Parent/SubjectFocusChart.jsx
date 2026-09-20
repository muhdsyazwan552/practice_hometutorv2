import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { vizTokens } from '@/utils/parentChartTokens';

/**
 * Average score per subject, weakest first.
 *
 * The reader's job is "which subject needs help", which is emphasis, not
 * identity: every bar wears the one series hue and only the weakest is lifted
 * into the alert hue — paired with an icon and a "Needs focus" label so the
 * colour is never the only thing carrying that meaning.
 */
export default function SubjectFocusChart({ subjects = [], windowDays = 30 }) {
    const [hovered, setHovered] = useState(null);

    if (! subjects.length) {
        return (
            <Frame windowDays={windowDays}>
                <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-400">
                    No completed sessions in the last {windowDays} days, so there is nothing to compare yet.
                </p>
            </Frame>
        );
    }

    // One subject is a number, not a chart — a single bar compares against nothing.
    if (subjects.length === 1) {
        const only = subjects[0];

        return (
            <Frame windowDays={windowDays}>
                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-500">Only subject with activity</p>
                    <p className="mt-2 text-4xl font-extrabold tracking-tight text-[#082c58]">{only.score}%</p>
                    <p className="mt-2 font-bold text-slate-700">{only.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                        {only.sessions} {only.sessions === 1 ? 'session' : 'sessions'} · {only.questions} questions
                        answered
                    </p>
                    <p className="mt-4 text-sm text-slate-500">
                        A comparison appears once a second subject has been practised.
                    </p>
                </div>
            </Frame>
        );
    }

    const weakest = subjects[0];

    return (
        <Frame windowDays={windowDays}>
            <ul className="mt-6 space-y-4">
                {subjects.map((subject, index) => {
                    const isWeakest = index === 0;
                    const colour = isWeakest ? vizTokens.emphasis : vizTokens.series;

                    return (
                        <li
                            key={subject.name}
                            onMouseEnter={() => setHovered(index)}
                            onMouseLeave={() => setHovered(null)}
                            className="relative"
                        >
                            <div className="flex items-end justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="flex flex-wrap items-center gap-2 font-bold text-slate-700">
                                        <span className="truncate">{subject.name}</span>
                                        {isWeakest && (
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">
                                                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                                Needs focus
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                        {subject.sessions} {subject.sessions === 1 ? 'session' : 'sessions'} ·{' '}
                                        {subject.questions} questions
                                    </p>
                                </div>
                                <span className="shrink-0 text-sm font-extrabold tabular-nums text-slate-700">
                                    {subject.score}%
                                </span>
                            </div>

                            <div className="mt-2 h-3.5 w-full overflow-hidden rounded-r-[4px] bg-slate-100">
                                <div
                                    className="h-full rounded-r-[4px] transition-opacity"
                                    style={{
                                        width: `${Math.max(Math.min(subject.score, 100), 1)}%`,
                                        backgroundColor: colour,
                                        opacity: hovered === null || hovered === index ? 1 : 0.55,
                                    }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>

            <p className="mt-5 rounded-xl bg-sky-50 p-3 text-xs leading-5 text-sky-900">
                <strong className="font-extrabold">{weakest.name}</strong> has the lowest average at {weakest.score}%
                over the last {windowDays} days. Practising it next is likely to lift the overall result the most.
            </p>
        </Frame>
    );
}

function Frame({ windowDays, children }) {
    return (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(8,44,88,0.07)] sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0788c9]">Where to help</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#082c58] sm:text-xl">
                Average score by subject
            </h2>
            <p className="mt-1 text-sm text-slate-500">Weakest first, across the last {windowDays} days.</p>
            {children}
        </section>
    );
}
