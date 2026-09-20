import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    ArrowRightOnRectangleIcon,
    BookOpenIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import ParentChildLayout from '@/Layouts/ParentChildLayout';
import LoginCalendar from '@/Components/Parent/LoginCalendar';
import QuestionsPerDayChart from '@/Components/Parent/QuestionsPerDayChart';
import SubjectFocusChart from '@/Components/Parent/SubjectFocusChart';

const ANSWER_RANGES = [
    { key: 'daily', label: 'Daily', caption: 'answered today' },
    { key: 'weekly', label: 'Weekly', caption: 'answered this week' },
    { key: 'monthly', label: 'Monthly', caption: 'answered this month' },
];

function StatCard({ icon: Icon, eyebrow, children }) {
    return (
        <article className="flex flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(8,44,88,0.07)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</p>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e6f5fc] text-[#0788c9]">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
            {children}
        </article>
    );
}

export default function ParentChildDashboard() {
    const {
        viewedChild,
        streaks = {},
        loginSummary = {},
        answerTotals = {},
        todayQuestions = { total: 0, subjects: [] },
        questionsPerDay = [],
        subjectPerformance = [],
        loginCalendar = [],
        loginHistory = [],
        chartDays = 30,
    } = usePage().props;

    const [range, setRange] = useState('weekly');
    const activeRange = ANSWER_RANGES.find((option) => option.key === range) ?? ANSWER_RANGES[1];

    return (
        <ParentChildLayout>
            <Head title={`${viewedChild?.name || 'Child'} · Dashboard`} />

            <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <StatCard icon={ArrowRightOnRectangleIcon} eyebrow="Logins this month">
                        <p className="mt-3 text-5xl font-extrabold leading-none tracking-tight text-[#082c58]">
                            {loginSummary.total_logins ?? 0}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-slate-500">
                            sign-ins in {loginSummary.month_label || 'this month'}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Across {loginSummary.active_days ?? 0}{' '}
                            {loginSummary.active_days === 1 ? 'day' : 'different days'}
                            {streaks.login ? ` · ${streaks.login}-day streak` : ''}
                        </p>
                        {loginSummary.last_login && (
                            <p className="mt-auto pt-4 text-xs font-semibold text-slate-400">
                                Last seen {loginSummary.last_login}
                            </p>
                        )}
                    </StatCard>

                    <StatCard icon={PencilSquareIcon} eyebrow="Questions answered">
                        <p className="mt-3 text-5xl font-extrabold leading-none tracking-tight text-[#082c58]">
                            {answerTotals[activeRange.key] ?? 0}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-slate-500">{activeRange.caption}</p>

                        <div
                            role="group"
                            aria-label="Question total period"
                            className="mt-auto flex gap-1 rounded-xl bg-slate-100 p-1 pt-1"
                        >
                            {ANSWER_RANGES.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    aria-pressed={option.key === range}
                                    onClick={() => setRange(option.key)}
                                    className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition ${
                                        option.key === range
                                            ? 'bg-white text-[#0788c9] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </StatCard>

                    <StatCard icon={BookOpenIcon} eyebrow="Today's questions">
                        <p className="mt-3 text-5xl font-extrabold leading-none tracking-tight text-[#082c58]">
                            {todayQuestions.total ?? 0}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-slate-500">answered today</p>

                        {todayQuestions.subjects?.length ? (
                            <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                                {todayQuestions.subjects.map((subject) => (
                                    <li key={subject.name} className="flex items-baseline gap-2 text-sm">
                                        <span className="min-w-0 truncate font-semibold text-slate-600">
                                            {subject.name}
                                        </span>
                                        <span className="h-px flex-1 border-b border-dotted border-slate-200" />
                                        <span className="shrink-0 font-extrabold tabular-nums text-[#082c58]">
                                            {subject.questions}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-400">
                                No subject practised yet today.
                            </p>
                        )}
                    </StatCard>
                </section>

                <QuestionsPerDayChart days={questionsPerDay} windowDays={chartDays} />

                <SubjectFocusChart subjects={subjectPerformance} windowDays={chartDays} />

                <LoginCalendar months={loginCalendar} history={loginHistory} />
            </main>
        </ParentChildLayout>
    );
}
