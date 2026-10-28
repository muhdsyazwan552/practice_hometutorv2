import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import SubjectLayout from "@/Layouts/SubjectLayout";
import DonutChart from "@/Components/ChartJsDonut";
import SubtopicDetailModal from "@/Components/SubtopicDetailModal";
import { useLanguage } from '@/Contexts/LanguageContext';

export default function SubjectReportPage() {
    const { locale } = useLanguage();
    const tr = (en, ms) => locale === 'ms' ? ms : en;
    const { props } = usePage();

    const {
        subject,
        subject_abbr,
        form,
        subject_id,
        level_id,
        question_type = "Objective",
        session_type = "practice",
        objective_topics = [],
        subjective_topics = [],
        availableLevels = {},
        availableSubjects = {},
        studentTheme,
    } = props;

    const themeSlug = studentTheme?.slug || "ocean-blue";
    const themeCardRadius = themeSlug === "brick-builders" ? "rounded-xl" : themeSlug === "robo-lab" ? "rounded-2xl" : themeSlug === "cat-club" || themeSlug === "candy-garden" ? "rounded-[2rem]" : "rounded-3xl";
    const themeSurface = { background: "color-mix(in srgb, var(--theme-card) 90%, var(--theme-accent) 10%)", borderColor: "color-mix(in srgb, var(--theme-accent) 25%, white)" };
    const themeSoftSurface = { background: "color-mix(in srgb, var(--theme-card) 82%, var(--theme-accent) 18%)", borderColor: "color-mix(in srgb, var(--theme-accent) 30%, white)" };

    const [currentStandard, setCurrentStandard] = useState(form || "Form 4");
    const [expandedTopics, setExpandedTopics] = useState({});
    const [activeTab, setActiveTab] = useState(question_type);
    const [activeSessionType, setActiveSessionType] = useState(session_type);
    const [timeRange, setTimeRange] = useState("Last 7 Days");
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Get topics based on active tab
    const topics =
        activeTab === "Objective" ? objective_topics : subjective_topics;

    const handleStandardChange = (standard) => {
        setCurrentStandard(standard);
        setIsLoading(true);
        const newLevelId = availableLevels?.[standard] || level_id;
        const newSubjectId = availableSubjects?.[standard] || subject_id;

        router.get(
            route("subject-report-page", {
                subject: subject_abbr || subject,
                form: standard,
                level_id: newLevelId,
                subject_id: newSubjectId,
                question_type: activeTab,
                session_type: activeSessionType,
                preload_both: "true",
            }),
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onError: () => setIsLoading(false),
            },
        );
    };

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;

        // Set loading state
        setIsLoading(true);
        setActiveTab(tab);

        router.get(
            route("subject-report-page", {
                subject: subject_abbr || subject,
                form: currentStandard,
                level_id: level_id,
                subject_id: subject_id,
                question_type: tab,
                session_type: activeSessionType,
            }),
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handleSessionTypeChange = (type) => {
        if (type === activeSessionType) return;

        setIsLoading(true);
        setActiveSessionType(type);
        closeModal();
        router.get(
            route("subject-report-page", {
                subject: subject_abbr || subject,
                form: currentStandard,
                level_id,
                subject_id,
                question_type: activeTab,
                session_type: type,
            }),
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
    };

    const toggleTopic = (topicId) => {
        setExpandedTopics((prev) => ({
            ...prev,
            [topicId]: !prev[topicId],
        }));
    };

    const handleSubtopicClick = (subtopic) => {
        setSelectedSubtopic(subtopic);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubtopic(null);
    };

    // Loading skeleton component — plain pulsing bars, so it doesn't need to
    // mirror the row grid's column count (which itself changes between the
    // Objective/Subjective tabs and between breakpoints).
    const LoadingSkeleton = () => (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-5 flex-none rounded bg-gray-200"></div>
                        <div className="h-4 w-1/3 rounded bg-gray-200"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    // One subtopic/topic "row" — a grid row from `sm:` up, a compact card on
    // mobile. Both the subtopic list and the "no subtopics" topic-as-row
    // fallback call this so the responsive layout only lives in one place.
    const gridColsClass =
        activeTab === "Objective" ? "sm:grid-cols-5" : "sm:grid-cols-3";
    const renderStatRow = (
        key,
        name,
        totalSessions,
        scoreStatistic,
        averageScore,
        lastSession,
        onClick,
    ) => (
        <div
            key={key}
            onClick={onClick}
            className={`cursor-pointer rounded-xl border p-4 transition hover:shadow-sm sm:grid sm:items-center sm:gap-4 sm:rounded-none sm:p-0 sm:px-6 sm:py-3 sm:last:border-0 sm:hover:shadow-none ${gridColsClass}`}
            style={themeSurface}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">{name}</p>
                {activeTab === "Objective" && (
                    <div
                        className="flex-none sm:hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DonutChart
                            percentage={averageScore || 0}
                            size={36}
                            strokeWidth={4}
                            label={tr('Accuracy', 'Ketepatan')}
                        />
                    </div>
                )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:hidden">
                <span>
                    {totalSessions || 0} {tr(totalSessions === 1 ? 'session' : 'sessions', 'sesi')}
                </span>
                {activeTab === "Objective" && (
                    <span>{tr('Score', 'Markah')}: {scoreStatistic || "—"}</span>
                )}
                <span>{tr('Last', 'Terakhir')}: {lastSession || "-"}</span>
            </div>

            <div className="hidden text-center text-sm text-gray-600 sm:block">
                {totalSessions || 0}
            </div>

            {activeTab === "Objective" && (
                <>
                    <div className="hidden text-center text-sm text-gray-600 sm:block">
                        {scoreStatistic || "—"}
                    </div>
                    <div
                        className="hidden justify-center sm:flex"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DonutChart
                            percentage={averageScore || 0}
                            size={40}
                            strokeWidth={4}
                            label={tr('Accuracy', 'Ketepatan')}
                        />
                    </div>
                    <div className="hidden text-center text-sm text-gray-600 sm:block">
                        {lastSession || "-"}
                    </div>
                </>
            )}

            {activeTab === "Subjective" && (
                <div className="hidden text-center text-sm text-gray-600 sm:block">
                    {lastSession || "-"}
                </div>
            )}
        </div>
    );

    return (
        <SubjectLayout
            subject={subject}
            activeTab="Report"
            selectedStandard={currentStandard}
            onStandardChange={handleStandardChange}
            isLoading={isLoading}
            loadingMessage={tr(`Loading ${activeSessionType} progress…`, `Sedang memuatkan kemajuan ${activeSessionType === 'mission' ? 'misi' : 'latihan'}…`)}
        >
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
                {/* Header */}
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                            {activeSessionType === 'mission' ? tr('Mission', 'Misi') : tr('Practice', 'Latihan')} {tr('Analysis', 'Analisis')}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 sm:text-base">
                            {activeSessionType === 'mission'
                                ? tr('Review your mission progress by topic.', 'Semak kemajuan misi anda mengikut topik.')
                                : tr('Review your practice progress by topic.', 'Semak kemajuan latihan anda mengikut topik.')}
                        </p>
                    </div>

                    {/* Tabs with loading indicator */}
                    <div className="flex gap-1 self-start rounded-xl p-1 sm:self-auto" style={themeSoftSurface}>
                        <button
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[90px] sm:flex-none ${activeTab === "Objective" ? "text-white shadow-sm" : "text-gray-600 hover:text-gray-800"} ${isLoading && activeTab === "Objective" ? "opacity-75" : ""}`}
                            style={activeTab === "Objective" ? { background: "var(--theme-hero)" } : undefined}
                            onClick={() => handleTabChange("Objective")}
                            disabled={isLoading}
                        >
                            {tr('Objective', 'Objektif')}
                        </button>

                        <button
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[90px] sm:flex-none ${activeTab === "Subjective" ? "text-white shadow-sm" : "text-gray-600 hover:text-gray-800"} ${isLoading && activeTab === "Subjective" ? "opacity-75" : ""}`}
                            style={activeTab === "Subjective" ? { background: "var(--theme-hero)" } : undefined}
                            onClick={() => handleTabChange("Subjective")}
                            disabled={isLoading}
                        >
                            {tr('Subjective', 'Subjektif')}
                        </button>
                    </div>
                </div>

                <div className="mb-5 flex gap-1 rounded-xl p-1" style={themeSoftSurface} aria-label={tr('Report type', 'Jenis laporan')}>
                    {[
                        ['practice', tr('Practice', 'Latihan')],
                        ['mission', tr('Mission', 'Misi')],
                    ].map(([type, label]) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleSessionTypeChange(type)}
                            disabled={isLoading}
                            aria-pressed={activeSessionType === type}
                            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none ${activeSessionType === type ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                            style={activeSessionType === type ? { background: 'var(--theme-hero)' } : undefined}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Progress Details */}
                <div className={`border shadow-sm ${themeCardRadius}`} style={themeSurface}>
                    <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                            {tr('Progress Details', 'Butiran Kemajuan')}
                        </h3>

                        {/* Time range */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {tr('Activity from:', 'Aktiviti sejak:')}
                            </span>
                            <select
                                value={timeRange}
                                onChange={(e) =>
                                    handleTimeRangeChange(e.target.value)
                                }
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                                disabled={isLoading}
                            >
                                <option value="Last 7 Days">{tr('Last 7 Days', '7 Hari Terakhir')}</option>
                                <option value="Last 30 Days">{tr('Last 30 Days', '30 Hari Terakhir')}</option>
                                <option value="Last 3 Months">{tr('Last 3 Months', '3 Bulan Terakhir')}</option>
                                <option value="All Time">{tr('All Time', 'Sepanjang Masa')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Topic listing with loading state */}
                    <div className="space-y-2 p-3 sm:p-4">
                        {isLoading ? (
                            <LoadingSkeleton />
                        ) : topics.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
                                <svg
                                    className="mx-auto mb-3 h-12 w-12 text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <p className="text-gray-500">
                                    {tr(`No ${activeTab.toLowerCase()} topics with questions available`, `Tiada topik ${activeTab === 'Objective' ? 'objektif' : 'subjektif'} dengan soalan tersedia`)}
                                </p>
                            </div>
                        ) : (
                            topics.map((topic) => (
                                <div key={topic.id} className={`overflow-hidden border transition hover:shadow-md ${themeCardRadius}`} style={themeSurface}>
                                    {/* Topic header */}
                                    <div
                                        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition sm:px-5"
                                        style={{ background: expandedTopics[topic.id] ? "color-mix(in srgb, var(--theme-accent) 9%, white)" : undefined }}
                                        onClick={() => toggleTopic(topic.id)}
                                    >
                                        <svg
                                            className={`h-4 w-4 flex-none text-gray-400 transition-transform ${expandedTopics[topic.id] ? "rotate-90" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                        <span className="text-sm font-semibold text-gray-800 sm:text-base">
                                            {topic.name}
                                        </span>
                                    </div>

                                    {/* Expanded */}
                                    {expandedTopics[topic.id] && (
                                        <div className="border-t p-3 sm:p-4" style={{ background: "color-mix(in srgb, var(--theme-card) 80%, var(--theme-accent) 20%)", borderColor: "color-mix(in srgb, var(--theme-accent) 15%, white)" }}>
                                            {/* Table header — column labels only make sense on the
                          sm:+ grid layout; the mobile cards self-describe. */}
                                            <div
                                                className={`mb-2 hidden text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid sm:gap-4 sm:px-6 ${gridColsClass}`}
                                            >
                                                <div>{tr('Subtopics', 'Subtopik')}</div>
                                                <div className="text-center">
                                                    {tr('Total Sessions', 'Jumlah Sesi')}
                                                </div>
                                                {activeTab === "Objective" && (
                                                    <>
                                                        <div className="text-center">
                                                            {tr('Score Statistic', 'Statistik Markah')}
                                                        </div>
                                                        <div className="text-center">
                                                            {tr('Average Score', 'Purata Markah')}
                                                        </div>
                                                        <div className="text-center">
                                                            {tr('Last Session', 'Sesi Terakhir')}
                                                        </div>
                                                    </>
                                                )}
                                                {activeTab === "Subjective" && (
                                                    <div className="text-center">
                                                        {tr('Last Session', 'Sesi Terakhir')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Table body */}
                                            <div className="space-y-2 sm:space-y-0 sm:rounded-xl sm:border" style={{ borderColor: "color-mix(in srgb, var(--theme-accent) 18%, white)" }}>
                                                {topic.subtopics &&
                                                topic.subtopics.length > 0
                                                    ? topic.subtopics.map(
                                                          (subtopic) =>
                                                              renderStatRow(
                                                                  subtopic.id,
                                                                  subtopic.name,
                                                                  subtopic
                                                                      .progress
                                                                      ?.total_sessions,
                                                                  subtopic
                                                                      .progress
                                                                      ?.score_statistic,
                                                                  subtopic
                                                                      .progress
                                                                      ?.average_score,
                                                                  subtopic
                                                                      .progress
                                                                      ?.last_session,
                                                                  (e) => {
                                                                      e.stopPropagation();
                                                                      handleSubtopicClick(
                                                                          subtopic,
                                                                      );
                                                                  },
                                                              ),
                                                      )
                                                    : // No subtopics - show topic directly
                                                      renderStatRow(
                                                          `topic-${topic.id}`,
                                                          topic.name,
                                                          topic.total_sessions,
                                                          topic.score_statistic,
                                                          topic.average_score,
                                                          topic.last_session,
                                                          (e) => {
                                                              e.stopPropagation();
                                                              handleSubtopicClick(
                                                                  topic,
                                                              );
                                                          },
                                                      )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Subtopic Detail Modal */}
            <SubtopicDetailModal
                isOpen={isModalOpen}
                onClose={closeModal}
                subtopicData={selectedSubtopic}
                questionType={activeTab}
                sessionType={activeSessionType}
            />
        </SubjectLayout>
    );
}
