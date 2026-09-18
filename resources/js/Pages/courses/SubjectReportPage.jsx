import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import SubjectLayout from '@/Layouts/SubjectLayout';
import DonutChart from '@/Components/ChartJsDonut';
import SubtopicDetailModal from '@/Components/SubtopicDetailModal';

export default function SubjectReportPage() {
  const { props } = usePage();

  const {
    subject,
    subject_abbr,
    form,
    subject_id,
    level_id,
    question_type = 'Objective',
    objective_topics = [],  
    subjective_topics = [], 
    availableLevels = {},
    availableSubjects = {},
  } = props;

  const [currentStandard, setCurrentStandard] = useState(form || 'Form 4');
  const [expandedTopics, setExpandedTopics] = useState({});
  const [activeTab, setActiveTab] = useState(question_type);
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get topics based on active tab
  const topics = activeTab === 'Objective' ? objective_topics : subjective_topics;

  const handleStandardChange = (standard) => {
    setCurrentStandard(standard);
    setIsLoading(true);
    const newLevelId = availableLevels?.[standard] || level_id;
    const newSubjectId = availableSubjects?.[standard] || subject_id;
    
    router.get(route('subject-report-page', {
      subject: subject_abbr || subject,
      form: standard,
      level_id: newLevelId,
      subject_id: newSubjectId,
      question_type: activeTab,
      preload_both: 'true'
    }), {
      preserveState: true,
      preserveScroll: true,
       onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
      onError: () => setIsLoading(false),
    });
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    
    // Set loading state
    setIsLoading(true);
    setActiveTab(tab);
    
    router.get(route('subject-report-page', {
      subject: subject_abbr || subject,
      form: currentStandard,
      level_id: level_id,
      subject_id: subject_id,
      question_type: tab
    }), {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsLoading(false),
    });
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
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
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
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
  const gridColsClass = activeTab === 'Objective' ? 'sm:grid-cols-5' : 'sm:grid-cols-3';
  const renderStatRow = (key, name, totalSessions, scoreStatistic, averageScore, lastSession, onClick) => (
    <div
      key={key}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border border-gray-100 bg-white p-4 transition hover:border-cyan-200 hover:shadow-sm sm:grid sm:items-center sm:gap-4 sm:rounded-none sm:border-0 sm:border-b sm:border-gray-100 sm:bg-transparent sm:p-0 sm:px-6 sm:py-3 sm:last:border-0 sm:hover:bg-slate-50 sm:hover:shadow-none ${gridColsClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        {activeTab === 'Objective' && (
          <div className="flex-none sm:hidden" onClick={(e) => e.stopPropagation()}>
            <DonutChart percentage={averageScore || 0} size={36} strokeWidth={4} label="Accuracy" />
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:hidden">
        <span>{totalSessions || 0} session{totalSessions === 1 ? '' : 's'}</span>
        {activeTab === 'Objective' && <span>Score: {scoreStatistic || '—'}</span>}
        <span>Last: {lastSession || '-'}</span>
      </div>

      <div className="hidden text-center text-sm text-gray-600 sm:block">{totalSessions || 0}</div>

      {activeTab === 'Objective' && (
        <>
          <div className="hidden text-center text-sm text-gray-600 sm:block">{scoreStatistic || '—'}</div>
          <div className="hidden justify-center sm:flex" onClick={(e) => e.stopPropagation()}>
            <DonutChart percentage={averageScore || 0} size={40} strokeWidth={4} label="Accuracy" />
          </div>
          <div className="hidden text-center text-sm text-gray-600 sm:block">{lastSession || '-'}</div>
        </>
      )}

      {activeTab === 'Subjective' && (
        <div className="hidden text-center text-sm text-gray-600 sm:block">{lastSession || '-'}</div>
      )}
    </div>
  );

  return (
    <SubjectLayout
      subject={subject}
      activeTab="Report"
      selectedStandard={currentStandard}
      onStandardChange={handleStandardChange}
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {activeTab} Analysis
            </h2>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              A look back at the {activeTab.toLowerCase()} practice you've done, so you can see where you're improving.
            </p>
          </div>

          {/* Tabs with loading indicator */}
          <div className="flex gap-1 self-start rounded-lg bg-gray-100 p-1 sm:self-auto">
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[90px] sm:flex-none ${activeTab === 'Objective'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
                } ${isLoading && activeTab === 'Objective' ? 'opacity-75' : ''}`}
              onClick={() => handleTabChange('Objective')}
              disabled={isLoading}
            >
              {isLoading && activeTab === 'Objective' && (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              )}
              Objective
            </button>

            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[90px] sm:flex-none ${activeTab === 'Subjective'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
                } ${isLoading && activeTab === 'Subjective' ? 'opacity-75' : ''}`}
              onClick={() => handleTabChange('Subjective')}
              disabled={isLoading}
            >
              {isLoading && activeTab === 'Subjective' && (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              )}
              Subjective
            </button>
          </div>
        </div>

        {/* Global loading overlay — z-[200] clears the sticky subject navbar
            (z-[110]) so the spinner isn't hidden behind it. */}
        {isLoading && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 p-4">
            <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-gray-700">Loading {activeTab.toLowerCase()} data...</p>
            </div>
          </div>
        )}

        {/* Progress Details */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Progress Details</h3>

            {/* Time range */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Activity from:</span>
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                disabled={isLoading}
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
                <option>All Time</option>
              </select>
            </div>
          </div>

          {/* Topic listing with loading state */}
          <div className="space-y-2 p-3 sm:p-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : topics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
                <svg className="mx-auto mb-3 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No {activeTab.toLowerCase()} topics with questions available</p>
              </div>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="overflow-hidden rounded-xl border border-gray-200 transition hover:border-gray-300"
                >
                  {/* Topic header */}
                  <div
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5"
                    onClick={() => toggleTopic(topic.id)}
                  >
                    <svg
                      className={`h-4 w-4 flex-none text-gray-400 transition-transform ${expandedTopics[topic.id] ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-800 sm:text-base">
                      {topic.name}
                    </span>
                  </div>

                  {/* Expanded */}
                  {expandedTopics[topic.id] && (
                    <div className="border-t border-gray-100 bg-slate-50/60 p-3 sm:p-4">

                      {/* Table header — column labels only make sense on the
                          sm:+ grid layout; the mobile cards self-describe. */}
                      <div className={`mb-2 hidden text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid sm:gap-4 sm:px-6 ${gridColsClass}`}>
                        <div>Subtopics</div>
                        <div className="text-center">Total Session</div>
                        {activeTab === 'Objective' && (
                          <>
                            <div className="text-center">Score Statistic</div>
                            <div className="text-center">Average Score</div>
                            <div className="text-center">Last Session</div>
                          </>
                        )}
                        {activeTab === 'Subjective' && <div className="text-center">Last Session</div>}
                      </div>

                      {/* Table body */}
                      <div className="space-y-2 sm:space-y-0 sm:rounded-xl sm:border sm:border-gray-100 sm:bg-white">
                        {topic.subtopics && topic.subtopics.length > 0 ? (
                          topic.subtopics.map((subtopic) => renderStatRow(
                            subtopic.id,
                            subtopic.name,
                            subtopic.progress?.total_sessions,
                            subtopic.progress?.score_statistic,
                            subtopic.progress?.average_score,
                            subtopic.progress?.last_session,
                            (e) => { e.stopPropagation(); handleSubtopicClick(subtopic); },
                          ))
                        ) : (
                          // No subtopics - show topic directly
                          renderStatRow(
                            `topic-${topic.id}`,
                            topic.name,
                            topic.total_sessions,
                            topic.score_statistic,
                            topic.average_score,
                            topic.last_session,
                            (e) => { e.stopPropagation(); handleSubtopicClick(topic); },
                          )
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
      />
    </SubjectLayout>
  );
}
