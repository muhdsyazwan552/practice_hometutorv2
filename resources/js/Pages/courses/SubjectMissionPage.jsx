import React, { useEffect, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import SubjectLayout from "@/Layouts/SubjectLayout";
import MasteryChallenge from "@/Components/MasteryChallenge";
import PracticeChallenge from "@/Components/PracticeChallenge";

const stages = [
    ["needPractice", "Rank 1 · Need practice"],
    ["practiced", "Rank 2 · Practised"],
    ["familiar", "Rank 3 · Familiar"],
    ["proficient", "Rank 4 · Proficient"],
    ["mastered", "Rank 5 · Mastered"],
];

const rankMap = {
    not_started: { rank: 1, label: "Need practice", color: "#fb7185" },
    need_practice: { rank: 1, label: "Need practice", color: "#fb7185" },
    practiced: { rank: 2, label: "Practised", color: "#22d3ee" },
    familiar: { rank: 3, label: "Familiar", color: "#fbbf24" },
    proficient: { rank: 4, label: "Proficient", color: "#a78bfa" },
    mastered: { rank: 5, label: "Mastered", color: "#34d399" },
};

const getTopicRank = (level) => rankMap[level] || rankMap.not_started;

function RankIcon({ rank, size = "md", muted = false }) {
    const colors = ["#fb7185", "#22d3ee", "#fbbf24", "#8b5cf6", "#10b981"];
    const dimensions = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-14 w-14" : "h-9 w-9";
    const iconClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
    const icons = {
        1: <path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm6 12 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />,
        2: <path d="m3 11 17-7-7 17-2.7-7.3L3 11Zm7.3 2.7L20 4" />,
        3: <><path d="M4 5.5h16v11H9l-5 3v-14Z" /><path d="m12 7 1.2 2.4 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4L12 7Z" /></>,
        4: <><path d="M12 3 18 6v5c0 4-2.6 7.2-6 9-3.4-1.8-6-5-6-9V6l6-3Z" /><path d="m12 7 1.2 2.3 2.6.4-1.9 1.9.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.9 2.6-.4L12 7ZM6 8 2.5 6.5 4 11l2 1m12-4 3.5-1.5L20 11l-2 1" /></>,
        5: <><path d="M7 5 9 8l3-4 3 4 2-3 1 6H6l1-6Z" /><circle cx="12" cy="14" r="5" /><path d="m12 11.5.8 1.6 1.8.3-1.3 1.3.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.3 1.8-.3.8-1.6ZM9 19l-1 3 4-2 4 2-1-3" /></>,
    };

    return (
        <span className={`${dimensions} flex shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-white shadow-lg transition ${muted ? "grayscale opacity-40" : ""}`} style={{ background: `linear-gradient(145deg, ${colors[rank - 1]}, #0f172a)` }} aria-label={`Rank ${rank} icon`}>
            <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[rank]}</svg>
        </span>
    );
}

function RankTrack({ rank, compact = false }) {
    return (
        <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`} aria-label={`Rank ${rank} of 5`}>
            {[1, 2, 3, 4, 5].map((step) => (
                <React.Fragment key={step}>
                    <RankIcon rank={step} size="sm" muted={step > rank} />
                    {step < 5 && <span className={`${compact ? "h-0.5 w-2" : "h-1 flex-1"} rounded-full ${step < rank ? "bg-cyan-400" : "bg-slate-200"}`} />}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function SubjectMissionPage() {
    const { props } = usePage();
    const { subject, subject_abbr, form, subject_id, level_id, availableLevels = {}, availableSubjects = {} } = props;
    const [progressData, setProgressData] = useState(null);
    const [skills, setSkills] = useState([]);
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [challengeOpen, setChallengeOpen] = useState(false);
    const [practiceOpen, setPracticeOpen] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedTopicName, setSelectedTopicName] = useState("");
    const [subtopicPage, setSubtopicPage] = useState(1);
    const [subtopicsPerPage, setSubtopicsPerPage] = useState(8);
    const [currentStandard, setCurrentStandard] = useState(form || "Form 4");

    const loadMission = async () => {
        const [progressRes, skillsRes, challengeRes] = await Promise.all([
            fetch(route("mission.progress", { subject: subject_abbr, subject_id, level_id })),
            fetch(route("mission.skills", { subject: subject_abbr, subject_id, level_id })),
            fetch(route("mission.challenge.info", { subject: subject_abbr, subject_id, level_id })),
        ]);
        const [progress, topicSkills, challengeInfo] = await Promise.all([
            progressRes.json(), skillsRes.json(), challengeRes.json(),
        ]);
        setProgressData(progress);
        setSkills(Array.isArray(topicSkills) ? topicSkills : []);
        setSubtopicPage(1);
        setChallenge(challengeInfo);
    };

    useEffect(() => {
        if (!subject_id || !level_id) return;
        loadMission().catch((error) => console.error("Error fetching subject data", error)).finally(() => setLoading(false));
    }, [subject_abbr, subject_id, level_id]);

    useEffect(() => {
        const updatePageSize = () => {
            if (window.innerWidth < 640) {
                setSubtopicsPerPage(4);
            } else if (window.innerWidth < 1024) {
                setSubtopicsPerPage(6);
            } else {
                setSubtopicsPerPage(8);
            }
        };

        updatePageSize();
        window.addEventListener("resize", updatePageSize);
        return () => window.removeEventListener("resize", updatePageSize);
    }, []);

    useEffect(() => {
        setSubtopicPage(1);
    }, [subtopicsPerPage]);

    const refreshMission = () => loadMission().catch((error) => console.error("Error refreshing data", error));
    const changeStandard = (standard) => {
        setCurrentStandard(standard);
        router.get(route("subject-mission-page", {
            subject: subject_abbr || subject,
            form: standard,
            level_id: availableLevels?.[standard] || level_id,
            subject_id: availableSubjects?.[standard] || subject_id,
        }));
    };
    const openPractice = (topic) => {
        setSelectedTopic(topic.id);
        setSelectedTopicName(topic.name);
        setPracticeOpen(true);
    };

    if (loading) return <SubjectLayout subject={subject_abbr} activeTab="Mission"><div className="flex h-96 items-center justify-center text-slate-500">Loading mission...</div></SubjectLayout>;

    const percentage = progressData?.percentage || 0;
    const totalSubtopicPages = Math.max(1, Math.ceil(skills.length / subtopicsPerPage));
    const visibleSkills = skills.slice((subtopicPage - 1) * subtopicsPerPage, subtopicPage * subtopicsPerPage);
    const firstVisiblePage = Math.max(1, Math.min(subtopicPage - 2, totalSubtopicPages - 4));
    const visiblePageNumbers = Array.from({ length: Math.min(5, totalSubtopicPages) }, (_, index) => firstVisiblePage + index);
    return (
        <SubjectLayout subject={subject} activeTab="Mission" selectedStandard={currentStandard} onStandardChange={changeStandard}>
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-b from-sky-50 via-blue-50 to-white p-4 text-slate-900 shadow-2xl shadow-sky-200/60 sm:p-5">
                        <div className="flex items-center justify-between"><h2 className="text-sm font-black tracking-widest text-blue-950">LEARNING QUEST</h2><span className="text-sky-500">✦</span></div>
                        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-sky-100 bg-white/90 p-3 shadow-sm">
                            <div className="relative h-20 w-20 shrink-0"><svg className="h-full w-full -rotate-90"><circle className="text-sky-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" /><circle className="text-sky-500" strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - percentage / 100)} /></svg><span className="absolute inset-0 flex items-center justify-center text-xl font-black text-blue-950">{percentage}%</span></div>
                            <div><p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Topic mastery</p><p className="mt-1 text-sm text-slate-500">Built from each subtopic rank.</p></div>
                        </div>
                        <div className="relative mt-6 space-y-3 before:absolute before:left-4 before:top-5 before:h-[calc(100%-2.5rem)] before:w-px before:bg-sky-200">
                            {stages.map(([key, label], index) => {
                                const count = progressData?.skills?.[key] || 0;
                                return <div key={key} className="relative flex items-center gap-3"><span className="z-10"><RankIcon rank={index + 1} /></span><div className="flex-1 rounded-xl border border-sky-100 bg-white/90 px-3 py-2 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-700">{label}</p><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-700">{count}</span></div><p className="text-xs text-slate-400">{count} topic{count === 1 ? "" : "s"}</p></div></div>;
                            })}
                        </div>
                        <div className="mt-6 border-t border-sky-100 pt-4">
                            <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black tracking-widest text-sky-700">TOPIC RANKS</h3><span className="text-xs text-slate-400">{progressData?.topics?.length || 0}</span></div>
                            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                {progressData?.topics?.map((topic) => {
                                    const topicRank = getTopicRank(topic.mastery_level);
                                    return (
                                        <div key={topic.id} className="rounded-xl border border-sky-100 bg-white/90 px-3 py-2.5 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <RankIcon rank={topicRank.rank} size="sm" />
                                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{topic.title}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{topicRank.label}</span>
                                            </div>
                                            {topic.subtopic_count > 0 && <p className="mt-1 pl-7 text-[10px] font-semibold text-sky-600">{topic.subtopic_count} subtopic{topic.subtopic_count === 1 ? "" : "s"}</p>}
                                            <div className="mt-2"><RankTrack rank={topicRank.rank} compact /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    <main className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-50 p-4 shadow-2xl shadow-sky-200/50 sm:p-6">
                        <div className="mb-5 flex items-center gap-3 text-blue-950"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xl text-sky-600">◉</span><h2 className="text-xl font-black tracking-wide">PRACTICE ARENA</h2></div>
                        {challenge && <section className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-white via-sky-50 to-blue-100 p-4 text-slate-900 shadow-lg shadow-sky-100 sm:p-6"><div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-cyan-300/30 blur-2xl" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-white text-2xl text-amber-400 shadow-sm sm:h-16 sm:w-16 sm:text-3xl">✦</div><div><p className="text-xs font-bold uppercase tracking-widest text-sky-600">Featured mission</p><h3 className="mt-1 text-xl font-black text-blue-950 sm:text-2xl">{challenge.title}</h3><p className="mt-1 text-sm text-slate-600">{challenge.description}</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm">{challenge.question_count || 10} questions</span><span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-700">Topic-based mastery</span></div></div></div><button onClick={() => setChallengeOpen(true)} className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-sky-200 transition hover:scale-[1.03] sm:w-auto">Play now →</button></div></section>}

                        <section className="mt-5 rounded-2xl bg-white p-3 shadow-sm sm:p-5">
                            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-cyan-600">Subtopic missions</p><h3 className="text-xl font-black text-slate-900">Choose a subtopic to practise</h3></div><p className="text-sm text-slate-500">Each subtopic has its own rank</p></div>
                            {skills.length === 0 ? (
                                <div className="rounded-2xl bg-sky-50 px-5 py-10 text-center text-lg font-bold text-sky-800">No subtopics are available for this subject and level.</div>
                            ) : (
                                <>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {visibleSkills.map((skill, index) => {
                                        const topicRank = getTopicRank(skill.mastery_level);
                                        return (
                                            <article key={skill.id || index} className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex shrink-0 flex-col items-center gap-1"><RankIcon rank={topicRank.rank} size="lg" /><span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Rank {topicRank.rank}</span></div>
                                                    <div className="min-w-0 flex-1">{skill.parent_name && <p className="mb-1 truncate text-[10px] font-black uppercase tracking-wider text-sky-600">{skill.parent_name}</p>}<p className="truncate font-bold text-slate-800">{skill.name}</p><div className="mt-1 flex flex-wrap items-center gap-2"><span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white" style={{ backgroundColor: topicRank.color }}>{topicRank.label}</span><span className="text-[10px] font-semibold text-slate-400">Rank {topicRank.rank} of 5</span></div></div>
                                                </div>
                                                <div className="mt-4 rounded-xl bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400"><span>Rank progress</span><span>R1 → R5</span></div><RankTrack rank={topicRank.rank} /></div>
                                                <div className="mt-4 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Next: {topicRank.rank < 5 ? rankMap[Object.keys(rankMap).find((key) => rankMap[key].rank === topicRank.rank + 1)]?.label : "Complete"}</span><button onClick={() => openPractice(skill)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-cyan-600">Start →</button></div>
                                            </article>
                                        );
                                    })}
                                </div>
                                {totalSubtopicPages > 1 && <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                                    <p className="text-xs font-semibold text-slate-500">Showing {(subtopicPage - 1) * subtopicsPerPage + 1}–{Math.min(subtopicPage * subtopicsPerPage, skills.length)} of {skills.length} subtopics</p>
                                    <div className="flex w-full items-center gap-1.5 sm:w-auto">
                                        <button type="button" disabled={subtopicPage === 1} onClick={() => setSubtopicPage((page) => Math.max(1, page - 1))} className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">← Previous</button>
                                        <span className="whitespace-nowrap px-2 text-xs font-black text-sky-700 sm:hidden">{subtopicPage} / {totalSubtopicPages}</span>
                                        <div className="hidden items-center gap-1.5 sm:flex">{visiblePageNumbers.map((page) => <button key={page} type="button" onClick={() => setSubtopicPage(page)} className={`h-8 min-w-8 rounded-lg px-2 text-xs font-black transition ${page === subtopicPage ? "bg-sky-500 text-white shadow-sm" : "bg-sky-50 text-sky-700 hover:bg-sky-100"}`}>{page}</button>)}</div>
                                        <button type="button" disabled={subtopicPage === totalSubtopicPages} onClick={() => setSubtopicPage((page) => Math.min(totalSubtopicPages, page + 1))} className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">Next →</button>
                                    </div>
                                </div>}
                                </>
                            )}
                        </section>
                    </main>
                </div>
            </div>
            <MasteryChallenge isOpen={challengeOpen} onClose={() => { setChallengeOpen(false); refreshMission(); }} subjectId={subject_id} levelId={level_id} subjectKey={subject} />
            <PracticeChallenge isOpen={practiceOpen} onClose={() => { setPracticeOpen(false); refreshMission(); }} subjectId={subject_id} levelId={level_id} subjectKey={subject} topicId={selectedTopic} topicName={selectedTopicName} />
        </SubjectLayout>
    );
}
