import { useCallback, useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ClockIcon,
    GiftIcon,
    PlayIcon,
    ShoppingBagIcon,
    SparklesIcon,
    TrophyIcon,
} from "@heroicons/react/24/outline";

const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

async function apiFetch(url, options = {}, retried = false) {
    const response = await fetch(url, {
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            "X-CSRF-TOKEN": csrfToken(),
        },
        ...options,
    });
    if (response.status === 419 && !retried) {
        await fetch("/sanctum/csrf-cookie", { credentials: "same-origin" });
        return apiFetch(url, options, true);
    }
    return response;
}

function formatArenaDate(iso) {
    return new Intl.DateTimeFormat("ms-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(iso));
}

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function Countdown({ targetIso, label }) {
    const [remaining, setRemaining] = useState(0);
    useEffect(() => {
        const tick = () =>
            setRemaining(
                Math.max(0, new Date(targetIso).getTime() - Date.now()),
            );
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetIso]);

    const units = [
        ...(Math.floor(remaining / 86400000)
            ? [{ label: "hari", value: Math.floor(remaining / 86400000) }]
            : []),
        { label: "jam", value: Math.floor((remaining % 86400000) / 3600000) },
        { label: "min", value: Math.floor((remaining % 3600000) / 60000) },
        { label: "saat", value: Math.floor((remaining % 60000) / 1000) },
    ];

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                    {label}
                </p>
                <span className="text-xs font-semibold text-slate-300">
                    {formatArenaDate(targetIso)} MYT
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {units.map((unit) => (
                    <span
                        key={unit.label}
                        className="min-w-14 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center"
                    >
                        <b className="block font-mono text-lg leading-5 text-white">
                            {String(unit.value).padStart(2, "0")}
                        </b>
                        <span className="text-[10px] font-semibold text-slate-300">
                            {unit.label}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function ArenaCountdownChip({ isOpen, opensAt, closesAt }) {
    const targetIso = isOpen ? closesAt : opensAt;
    const label = isOpen ? "Arena tamat dalam" : "Arena dibuka dalam";
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        const tick = () =>
            setRemaining(
                Math.max(0, new Date(targetIso).getTime() - Date.now()),
            );
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetIso]);

    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-200/15 bg-cyan-300/10 px-4 py-2.5 text-xs">
            <span className="font-bold text-cyan-100">{label}</span>
            <span className="font-mono text-sm font-extrabold tracking-wide text-white">
                {String(hours).padStart(2, "0")}:
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
            </span>
            <span className="text-slate-300">
                {formatArenaDate(targetIso)} MYT
            </span>
        </div>
    );
}

function Leaderboard({ rows, title }) {
    return (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#081c3d]/85 shadow-xl shadow-slate-950/20 backdrop-blur-sm">
            <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <TrophyIcon className="h-5 w-5 text-amber-300" />
                        <h2 className="font-extrabold text-white">{title}</h2>
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-cyan-200">
                        {rows.length} peserta
                    </span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                    Tahap anda sahaja · Betul tertinggi, kemudian masa
                    terpantas.
                </p>
            </div>
            {rows.length ? (
                <div className="divide-y divide-white/10">
                    {rows.slice(0, 8).map((row) => (
                        <div
                            key={`${row.rank}-${row.name}`}
                            className={`flex items-center gap-3 px-5 py-3 ${row.is_me ? "bg-cyan-400/10" : ""}`}
                        >
                            <span className="w-7 text-center text-sm font-extrabold text-amber-300">
                                {row.rank <= 3
                                    ? ["🥇", "🥈", "🥉"][row.rank - 1]
                                    : row.rank}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                                {row.name}
                                {row.is_me && (
                                    <span className="ml-1 text-xs text-cyan-200">
                                        (anda)
                                    </span>
                                )}
                            </span>
                            <span className="text-right">
                                <span className="block text-xs font-extrabold text-emerald-300">
                                    {row.correct_answers}/{row.total_questions}{" "}
                                    betul
                                </span>
                                <span className="mt-0.5 block text-[10px] font-semibold text-slate-300">
                                    {formatDuration(row.total_time_seconds)}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="px-5 py-10 text-center text-sm text-slate-300">
                    <TrophyIcon className="mx-auto mb-3 h-7 w-7 text-cyan-300" />
                    Belum ada peserta yang selesai bermain.
                </div>
            )}
        </section>
    );
}

function QuestionRunner({ sessionUuid, onFinished, onSessionError }) {
    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [current, setCurrent] = useState(1);
    const [total, setTotal] = useState(10);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startedAt, setStartedAt] = useState(Date.now());

    const loadNext = useCallback(async () => {
        setLoading(true);
        setSelected(null);
        setFeedback(null);
        try {
            const response = await apiFetch(
                `${route("quiz-arena.question")}?session_uuid=${sessionUuid}`,
            );
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message || "Quiz Arena telah ditutup.");
            if (data.completed) return onFinished();
            setQuestion(data.question);
            setAnswers(data.answers || []);
            setCurrent(data.current_question);
            setTotal(data.total_questions);
            setStartedAt(Date.now());
        } catch (error) {
            onSessionError(error.message);
        } finally {
            setLoading(false);
        }
    }, [sessionUuid, onFinished, onSessionError]);

    useEffect(() => {
        loadNext();
    }, [loadNext]);

    const submit = async (answerId) => {
        if (selected || !question) return;
        setSelected(answerId);
        try {
            const response = await apiFetch(route("quiz-arena.answer"), {
                method: "POST",
                body: JSON.stringify({
                    session_uuid: sessionUuid,
                    question_id: question.id,
                    answer_id: answerId,
                    time_taken: Math.round((Date.now() - startedAt) / 1000),
                }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message || "Quiz Arena telah ditutup.");
            setFeedback(data.is_correct ? "correct" : "wrong");
            setTimeout(() => (data.completed ? onFinished() : loadNext()), 850);
        } catch (error) {
            onSessionError(error.message);
        }
    };

    if (loading || !question)
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200/30 border-t-cyan-300" />
            </div>
        );
    return (
        <div className="mx-auto max-w-3xl py-8">
            <div className="mb-4 flex items-center justify-between gap-4">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-cyan-100">
                    Soalan {current} / {total}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                    Masa dikira semasa menjawab sahaja
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    style={{ width: `${(current / total) * 100}%` }}
                />
            </div>
            <section className="mt-5 rounded-3xl border border-white/15 bg-[#081c3d]/90 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
                <div
                    className="prose prose-invert max-w-none text-lg font-semibold text-white"
                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                />
                {question.question_file && (
                    <img
                        src={question.question_file}
                        alt="Soalan"
                        className="mt-5 max-h-64 rounded-2xl"
                    />
                )}
                <div className="mt-6 grid gap-3">
                    {answers.map((answer, index) => {
                        const correct = feedback && answer.is_correct_answer;
                        const wrong =
                            feedback === "wrong" && selected === answer.id;
                        return (
                            <button
                                key={answer.id}
                                type="button"
                                disabled={!!selected}
                                onClick={() => submit(answer.id)}
                                className={`flex gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition ${correct ? "border-emerald-400 bg-emerald-400/15 text-white" : wrong ? "border-rose-400 bg-rose-400/15 text-white" : "border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300 hover:bg-cyan-400/10"}`}
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs text-cyan-100">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: answer.answer_text,
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

function WalletCard({ balance }) {
    return (
        <section className="rounded-3xl border border-white/10 bg-[#081c3d]/85 p-5 shadow-xl backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                Wallet anda
            </p>
            <p className="mt-2 text-4xl font-extrabold text-amber-200">
                ⭐ {balance.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-slate-300">
                Tebus tema dan ganjaran di Kedai Quiz Arena.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                    href={route("quiz-arena.shop")}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-center text-xs font-bold text-white hover:bg-white/20"
                >
                    Kedai <ArrowRightIcon className="ml-1 inline h-3.5 w-3.5" />
                </Link>
                <Link
                    href={route("quiz-arena.rewards")}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-center text-xs font-bold text-white hover:bg-white/20"
                >
                    Tema <ArrowRightIcon className="ml-1 inline h-3.5 w-3.5" />
                </Link>
            </div>
        </section>
    );
}

export default function QuizArena({
    hasLevel,
    isOpen,
    opensAt,
    closesAt,
    session,
    leaderboard,
    pointBalance,
}) {
    const [phase, setPhase] = useState(() =>
        !isOpen
            ? "closed"
            : session?.status === "completed"
              ? "finished"
              : session?.status === "in_progress"
                ? "playing"
                : "ready",
    );
    const [sessionUuid, setSessionUuid] = useState(session?.uuid ?? null);
    const [summary, setSummary] = useState(
        session?.status === "completed" ? session : null,
    );
    const [rows, setRows] = useState(leaderboard || []);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState(null);

    const start = async () => {
        setStarting(true);
        setError(null);
        try {
            const response = await apiFetch(route("quiz-arena.start"), {
                method: "POST",
                body: JSON.stringify({}),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    data.message ||
                        data.error ||
                        "Tidak dapat mulakan Quiz Arena.",
                );
            setSessionUuid(data.session_uuid);
            setPhase("playing");
        } catch (err) {
            setError(err.message);
        } finally {
            setStarting(false);
        }
    };
    const finish = useCallback(async () => {
        const response = await apiFetch(
            `${route("quiz-arena.summary")}?session_uuid=${sessionUuid}`,
        );
        const data = await response.json();
        setSummary(data);
        setRows(data.leaderboard || []);
        setPhase("finished");
    }, [sessionUuid]);
    const sessionError = useCallback((message) => {
        setError(message);
        setPhase("closed");
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06132b] text-white">
            <div
                className="fixed inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url(/images/quiz-arena-sky-realm.png)",
                }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-[#06132b]/55 via-[#06132b]/75 to-[#06132b]" />
            <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#061a3a]/80 px-4 py-3 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("dashboard")}
                            className="rounded-xl p-2 text-cyan-100 hover:bg-white/10"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <span className="h-7 w-px bg-white/15" />
                        <ApplicationLogo className="h-9 w-9 rounded-xl bg-white/10 p-1" />
                        <div>
                            <p className="text-sm font-extrabold tracking-tight text-white">
                                Quiz Arena
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                                Weekend challenge
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm font-extrabold text-amber-200 sm:block">
                            ⭐ {pointBalance.toLocaleString()} point
                        </span>
                        <Link
                            href={route("quiz-arena.shop")}
                            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                        >
                            <ShoppingBagIcon className="mr-1 inline h-4 w-4 text-cyan-200" />{" "}
                            Kedai
                        </Link>
                        <Link
                            href={route("quiz-arena.rewards")}
                            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                        >
                            <GiftIcon className="mr-1 inline h-4 w-4 text-cyan-200" />{" "}
                            Hadiah
                        </Link>
                    </div>
      </header>
      <ArenaCountdownChip isOpen={isOpen} opensAt={opensAt} closesAt={closesAt} />
      {error && (
                    <div className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-500/20 px-4 py-3 text-sm font-medium text-rose-100">
                        {error}
                    </div>
                )}
                {!hasLevel && (
                    <div className="mt-6 rounded-3xl border border-amber-300/30 bg-amber-400/10 px-5 py-4 text-center text-sm text-amber-100">
                        Akaun anda belum mempunyai tahap. Sila hubungi ibu bapa
                        atau pentadbir.
                    </div>
                )}
                {phase === "playing" && sessionUuid ? (
                    <QuestionRunner
                        sessionUuid={sessionUuid}
                        onFinished={finish}
                        onSessionError={sessionError}
                    />
                ) : (
                    <main className="py-8 sm:py-12">
                        {phase === "ready" && hasLevel && (
                            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,.8fr)]">
                                <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#071a3c]/85 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur-md sm:p-9">
                                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
                                    <div className="relative max-w-xl">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
                                            <SparklesIcon className="h-4 w-4" />{" "}
                                            Arena dibuka sekarang
                                        </span>
                                        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
                                            Buktikan ilmu.
                                            <br />
                                            <span className="text-cyan-300">
                                                Kumpul ganjaran.
                                            </span>
                                        </h1>
                                        <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
                                            Jawab 10 soalan rawak ikut tahap
                                            anda dan rebut tempat dalam
                                            kedudukan minggu ini.
                                        </p>
                                        <div className="mt-7">
                                            <Countdown
                                                targetIso={closesAt}
                                                label="Arena ditutup dalam"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={start}
                                            disabled={starting}
                                            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3.5 font-extrabold text-[#061a3a] shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                                        >
                                            <PlayIcon className="h-5 w-5" />{" "}
                                            {starting
                                                ? "Memulakan…"
                                                : "Mula Quiz"}
                                        </button>
                                        <p className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                                            <ClockIcon className="h-4 w-4 text-cyan-200" />{" "}
                                            Masa hanya direkodkan ketika
                                            menjawab soalan.
                                        </p>
                                    </div>
                                </section>
                                <div className="space-y-5">
                                    <WalletCard balance={pointBalance} />
                                    <Leaderboard
                                        rows={rows}
                                        title="Kedudukan semasa"
                                    />
                                </div>
                            </div>
                        )}
                        {phase === "closed" && hasLevel && (
                            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                                <section className="rounded-3xl border border-white/15 bg-[#071a3c]/85 p-7 shadow-2xl backdrop-blur-md sm:p-10">
                                    <span className="inline-flex rounded-2xl bg-white/10 p-3 text-cyan-200">
                                        <TrophyIcon className="h-7 w-7" />
                                    </span>
                                    <h1 className="mt-5 text-3xl font-extrabold">
                                        Quiz Arena sedang berehat.
                                    </h1>
                                    <p className="mt-3 max-w-lg text-sm leading-6 text-slate-200">
                                        Sediakan diri anda untuk cabaran hujung
                                        minggu seterusnya. Kedai dan tema tetap
                                        boleh diterokai sekarang.
                                    </p>
                                    <div className="mt-7">
                                        <Countdown
                                            targetIso={opensAt}
                                            label="Arena dibuka dalam"
                                        />
                                    </div>
                                    <div className="mt-7 flex flex-wrap gap-3">
                                        <Link
                                            href={route("quiz-arena.shop")}
                                            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-extrabold text-[#061a3a]"
                                        >
                                            Teroka Kedai
                                        </Link>
                                        <Link
                                            href={route("quiz-arena.rewards")}
                                            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white"
                                        >
                                            Lihat Hadiah & Tema
                                        </Link>
                                    </div>
                                </section>
                                <Leaderboard
                                    rows={rows}
                                    title="Kedudukan terakhir"
                                />
                            </div>
                        )}
                        {phase === "finished" && summary && (
                            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                                <section className="rounded-3xl border border-white/15 bg-[#071a3c]/90 p-7 text-center shadow-2xl backdrop-blur-md sm:p-10">
                                    <span className="inline-flex rounded-full bg-amber-300/15 p-4 text-amber-200">
                                        <TrophyIcon className="h-10 w-10" />
                                    </span>
                                    <h1 className="mt-5 text-3xl font-extrabold">
                                        Cabaran selesai!
                                    </h1>
                                    <p className="mt-3 text-lg font-semibold text-cyan-100">
                                        {summary.correct_answers} /{" "}
                                        {summary.total_questions} jawapan betul
                                    </p>
                                    <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-white/10 p-4">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                                                Masa jawapan
                                            </p>
                                            <p className="mt-1 text-xl font-extrabold">
                                                {formatDuration(
                                                    summary.total_time_seconds,
                                                )}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-white/10 p-4">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                                                Kedudukan
                                            </p>
                                            <p className="mt-1 text-xl font-extrabold">
                                                #{summary.rank}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-sm text-amber-200">
                                        {summary.points_awarded !== null &&
                                        summary.points_awarded !== undefined
                                            ? `Anda menerima ${summary.points_awarded} point.`
                                            : "Kedudukan anda telah dikira secara langsung. Point akan diberikan selepas weekend selesai."}
                                    </p>
                                </section>
                                <Leaderboard
                                    rows={rows}
                                    title="Kedudukan anda"
                                />
                            </div>
                        )}
                    </main>
                )}
            </div>
        </div>
    );
}
