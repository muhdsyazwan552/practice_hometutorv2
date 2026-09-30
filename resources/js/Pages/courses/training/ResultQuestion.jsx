import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/Contexts/LanguageContext';
import ThemeLoader from '@/Components/ThemeLoader';

const ease = [0.22, 1, 0.36, 1];

const formatDuration = (value) => {
  const seconds = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return minutes ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
};

// Question and answer text arrives as HTML from the question bank; the review
// shows a plain-text preview (never injected as HTML).
const toPlain = (html) => {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return String(html);
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};
const hasImageTag = (html) => /<img\b/i.test(String(html || ''));
const isLinkOrImage = (value) => /^https?:\/\//i.test(value) || /\.(png|jpe?g|gif|webp|svg|pdf)(\?|$)/i.test(value);

/** Number that counts up from 0 when it first appears. */
function CountUp({ value, suffix = '', duration = 1.2 }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) { setShown(value); return undefined; }
    const controls = animate(0, value, { duration, ease, onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [value, duration, reduced]);
  return <>{shown}{suffix}</>;
}

/** Score ring that fills to `percent`. */
function ScoreRing({ percent, emoji }) {
  const radius = 52;
  return (
    <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none" stroke="white" strokeWidth="10" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.001, percent / 100) }}
          transition={{ duration: 1.4, ease, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.5 }} className="text-3xl">{emoji}</motion.div>
          <div className="text-2xl font-black text-white"><CountUp value={percent} suffix="%" /></div>
        </div>
      </div>
    </div>
  );
}

const tierStyles = {
  excellent: { gradient: 'from-emerald-500 via-teal-500 to-sky-600', emoji: '🏆' },
  good: { gradient: 'from-sky-500 via-blue-600 to-indigo-600', emoji: '⭐' },
  keep: { gradient: 'from-amber-500 via-orange-500 to-rose-500', emoji: '💪' },
  start: { gradient: 'from-slate-600 via-slate-700 to-slate-800', emoji: '🌱' },
};

const statusStyles = {
  correct: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  wrong: 'bg-rose-50 text-rose-700 ring-rose-200',
  skipped: 'bg-slate-100 text-slate-600 ring-slate-200',
  answered: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export default function ResultQuestion({
  objectiveResults,
  subjectiveResults,
  onTryAgain,
  onRetryWrong,
  quizType = 'objective',
  subject,
  standard,
  sectionId,
  contentId,
  topic,
  sectionTitle,
  topic_id,
  form,
  level_id,
  subject_id,
  isEarlyExit = false,
  customBackAction,
}) {
  const { t } = useLanguage();
  const tr = (key, fallback, vars = {}) => Object.entries(vars).reduce(
    (text, [name, value]) => text.replace(`:${name}`, value),
    t(`result.${key}`, fallback),
  );
  const reduced = useReducedMotion();
  const isObjective = quizType === 'objective';
  const results = isObjective ? objectiveResults : subjectiveResults;
  const [topicNavigation, setTopicNavigation] = useState(undefined);
  const [filter, setFilter] = useState('all');

  const metrics = useMemo(() => {
    const total = Math.max(0, Number(results?.totalQuestions) || 0);
    const skipped = Math.min(total, Math.max(0, Number(results?.skippedAnswers ?? results?.skipped) || 0));
    const answered = Math.min(total, Math.max(0, Number(results?.answered) || total - skipped));
    // Subjective answers are not marked, so they are counted as answered, never as "correct".
    const correct = isObjective ? Math.min(total, Math.max(0, Number(results?.correctAnswers) || 0)) : null;
    const timeElapsed = Math.max(0, Number(results?.timeElapsed ?? results?.total_time_seconds) || 0);
    const headline = total ? Math.round(((isObjective ? correct : answered) / total) * 100) : 0;

    return {
      total,
      skipped,
      answered,
      correct,
      wrong: isObjective ? Math.max(0, total - correct - skipped) : null,
      timeElapsed,
      headline,
      averageTime: total ? Math.round(timeElapsed / total) : 0,
    };
  }, [isObjective, results]);

  const reviewItems = useMemo(() => (results?.questions || []).map((q, index) => {
    const status = q.skipped || !q.answered ? 'skipped' : isObjective ? (q.correct ? 'correct' : 'wrong') : 'answered';
    return { ...q, index, status };
  }), [isObjective, results]);

  const retryCount = reviewItems.filter((q) => q.status === 'wrong' || q.status === 'skipped').length;
  const filters = isObjective
    ? [['all', tr('filter_all', 'All')], ['wrong', tr('filter_wrong', 'Wrong')], ['correct', tr('filter_correct', 'Correct')], ['skipped', tr('filter_skipped', 'Skipped')]]
    : [['all', tr('filter_all', 'All')], ['answered', tr('filter_answered', 'Answered')], ['skipped', tr('filter_skipped', 'Skipped')]];
  const visibleItems = filter === 'all' ? reviewItems : reviewItems.filter((q) => q.status === filter);
  const countFor = (key) => (key === 'all' ? reviewItems.length : reviewItems.filter((q) => q.status === key).length);

  // Headline, message and colours follow the score (objective) or completion (subjective).
  const tier = (() => {
    if (isEarlyExit) return { key: 'start', title: tr('title_saved', 'Your progress is saved'), message: tr('msg_saved', '') };
    if (!isObjective) {
      return metrics.skipped === 0
        ? { key: 'good', title: tr('title_sub_done', 'All questions answered!'), message: tr('msg_sub_done', '') }
        : { key: 'keep', title: tr('title_sub_partial', 'Well done for trying!'), message: tr('msg_sub_partial', '') };
    }
    if (metrics.headline >= 80) return { key: 'excellent', title: tr('title_excellent', 'Excellent!'), message: tr('msg_excellent', '') };
    if (metrics.headline >= 50) return { key: 'good', title: tr('title_good', 'Good work, almost there!'), message: tr('msg_good', '') };
    if (metrics.headline > 0) return { key: 'keep', title: tr('title_keep_going', 'Keep going!'), message: tr('msg_keep_going', '') };
    return { key: 'start', title: tr('title_start', 'Every attempt counts'), message: tr('msg_start', '') };
  })();
  const style = tierStyles[tier.key];

  // A short confetti burst for an excellent score.
  useEffect(() => {
    if (tier.key !== 'excellent' || reduced) return undefined;
    const timer = setTimeout(() => {
      confetti({ particleCount: 90, spread: 70, origin: { x: 0.25, y: 0.35 }, disableForReducedMotion: true });
      confetti({ particleCount: 90, spread: 70, origin: { x: 0.75, y: 0.35 }, disableForReducedMotion: true });
    }, 600);
    return () => clearTimeout(timer);
  }, [tier.key, reduced]);

  useEffect(() => {
    if (!subject_id || !level_id || !topic_id) {
      setTopicNavigation(null);
      return undefined;
    }

    let active = true;
    setTopicNavigation(undefined);

    axios.get(route('practice.next-topic'), {
      params: {
        subject_id,
        level_id,
        topic_id,
        question_type_id: isObjective ? 1 : 2,
      },
    }).then((response) => {
      if (active) {
        setTopicNavigation({
          currentTopic: response.data.current_topic || null,
          nextTopic: response.data.next_topic || null,
        });
      }
    }).catch(() => {
      if (active) setTopicNavigation(null);
    });

    return () => { active = false; };
  }, [level_id, isObjective, subject_id, topic_id]);

  const practiceUrl = (targetTopicId) => {
    const query = new URLSearchParams();
    const values = {
      topic_id: targetTopicId,
      subject,
      standard,
      form: form || standard,
      sectionId,
      sectionTitle,
      contentId,
      subject_id,
      level_id,
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    });

    return `/${isObjective ? 'objective-page' : 'subjective-page'}?${query.toString()}`;
  };

  const handleBackToSubject = () => {
    if (customBackAction) {
      customBackAction();
      return;
    }

    const query = new URLSearchParams();
    if (form || standard) query.set('form', form || standard);
    if (level_id) query.set('level_id', level_id);
    if (subject_id) query.set('subject_id', subject_id);
    window.location.assign(`/subject/${subject}?${query.toString()}`);
  };

  if (!results) {
    return <ThemeLoader variant="page" message={tr('loading', 'Loading your results…')} />;
  }

  const isComplete = results.isComplete
    || results.completionType === 'all_questions'
    || (metrics.skipped === 0 && !isEarlyExit);
  const repeatTopic = topicNavigation?.currentTopic;
  const nextTopic = topicNavigation?.nextTopic;
  const isCheckingTopics = topicNavigation === undefined;
  const canRetryWrong = isObjective && !isEarlyExit && typeof onRetryWrong === 'function' && retryCount > 0;

  const stats = isObjective
    ? [
      [tr('accuracy', 'Accuracy'), <CountUp key="a" value={metrics.headline} suffix="%" />, 'text-slate-900'],
      [tr('correct', 'Correct'), <><CountUp key="c" value={metrics.correct} /><span className="text-base text-slate-400">/{metrics.total}</span></>, 'text-emerald-600'],
      [tr('time', 'Time'), formatDuration(metrics.timeElapsed), 'text-slate-900'],
      [tr('average', 'Avg / question'), formatDuration(metrics.averageTime), 'text-slate-900'],
    ]
    : [
      [tr('completion', 'Completed'), <CountUp key="p" value={metrics.headline} suffix="%" />, 'text-slate-900'],
      [tr('answered', 'Answered'), <><CountUp key="n" value={metrics.answered} /><span className="text-base text-slate-400">/{metrics.total}</span></>, 'text-sky-600'],
      [tr('time', 'Time'), formatDuration(metrics.timeElapsed), 'text-slate-900'],
      [tr('average', 'Avg / question'), formatDuration(metrics.averageTime), 'text-slate-900'],
    ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_42rem)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between gap-3 sm:mb-8">
          <button onClick={handleBackToSubject} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400">
            <span aria-hidden="true">←</span><span className="hidden sm:inline">{tr('back_to_subject', 'Back to subject')}</span>
          </button>
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-sky-700 shadow-sm ring-1 ring-sky-100">
            {isObjective ? tr('objective_practice', 'Objective practice') : tr('subjective_practice', 'Subjective practice')}
          </span>
        </header>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-sky-100/70 ring-1 ring-slate-200/70"
        >
          <div className={`relative overflow-hidden bg-gradient-to-br ${style.gradient} px-5 py-8 text-white sm:px-9 sm:py-10`}>
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold ring-1 ring-white/30">
                  {isComplete ? tr('completed', 'Completed') : tr('saved_progress', 'Progress saved')}
                </span>
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease }} className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  {tier.title}
                </motion.h1>
                <p className="mt-2 text-sm font-semibold text-white/85 sm:text-base">{topic || sectionTitle}</p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.6 }} className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
                  {tier.message}
                </motion.p>
              </div>
              <ScoreRing percent={metrics.headline} emoji={style.emoji} />
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
            {stats.map(([label, value, color], i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07, duration: 0.5, ease }} className="p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-black sm:text-3xl ${color}`}>{value}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {!isObjective && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <span aria-hidden="true">ℹ️</span>{tr('subjective_note', 'Subjective answers are not marked automatically yet.')}
          </motion.p>
        )}

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Review my answers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6, ease }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-slate-900 sm:text-xl">{tr('review_title', 'Review my answers')}</h2>
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {filters.map(([key, label]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => setFilter(key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {label} <span className="opacity-60">{countFor(key)}</span>
                  </button>
                ))}
              </div>
            </div>
            {isObjective && <p className="mt-2 text-xs text-slate-400">{tr('first_try_note', 'Scored on your first attempt.')}</p>}

            <ul className="mt-5 space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {visibleItems.map((q) => {
                  const text = toPlain(q.question);
                  const schema = typeof q.schema === 'string' ? q.schema.trim() : '';
                  const schemaIsLink = schema && isLinkOrImage(schema);
                  return (
                    <motion.li
                      key={q.index}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-slate-500">{tr('question', 'Question')} {q.index + 1}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${statusStyles[q.status]}`}>
                          {tr(`status_${q.status}`, q.status)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-800">
                        {text || (q.hasImage || hasImageTag(q.question) ? `🖼️ ${tr('image_question', 'Picture question')}` : '—')}
                        {text && (q.hasImage || hasImageTag(q.question)) && <span className="ml-1 text-slate-400">🖼️</span>}
                      </p>

                      {isObjective && q.status !== 'skipped' && (
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <div className={`rounded-xl px-3 py-2 ${q.status === 'correct' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            <p className="text-xs font-bold opacity-70">{tr('your_answer', 'Your answer')}</p>
                            <p className="font-semibold">{toPlain(q.chosenAnswer) || '—'}</p>
                          </div>
                          {q.status === 'wrong' && (
                            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
                              <p className="text-xs font-bold opacity-70">{tr('correct_answer', 'Correct answer')}</p>
                              <p className="font-semibold">{toPlain(q.correctAnswer) || '—'}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {isObjective && q.status === 'skipped' && q.correctAnswer && (
                        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                          <p className="text-xs font-bold opacity-70">{tr('correct_answer', 'Correct answer')}</p>
                          <p className="font-semibold">{toPlain(q.correctAnswer)}</p>
                        </div>
                      )}

                      {!isObjective && (
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <div className="rounded-xl bg-sky-50 px-3 py-2 text-sky-900">
                            <p className="text-xs font-bold opacity-70">{tr('your_answer', 'Your answer')}</p>
                            <p className="line-clamp-4 whitespace-pre-wrap">{q.answer?.trim() || <span className="italic opacity-60">{tr('no_answer', 'No answer')}</span>}</p>
                          </div>
                          {schema && (
                            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
                              <p className="text-xs font-bold opacity-70">{tr('scheme', 'Marking scheme')}</p>
                              {schemaIsLink ? (
                                /^https?:\/\//i.test(schema)
                                  ? <a href={schema} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{tr('open_scheme', 'Open scheme')} ↗</a>
                                  : <p className="font-semibold">🖼️ {tr('scheme', 'Marking scheme')}</p>
                              ) : (
                                <p className="line-clamp-4">{toPlain(schema)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
              {visibleItems.length === 0 && <li className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">{tr('empty_filter', 'No questions in this category.')}</li>}
            </ul>
          </motion.div>

          {/* Next steps */}
          <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease }} className="order-first space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
            {canRetryWrong && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetryWrong}
                className="flex w-full items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-rose-500 to-orange-500 p-5 text-left text-white shadow-lg shadow-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
              >
                <span>
                  <span className="block text-base font-black">{tr('retry_wrong', 'Retry missed questions (:count)', { count: retryCount })}</span>
                  <span className="mt-0.5 block text-xs font-medium text-white/85">{tr('retry_wrong_hint', 'Practise only the questions you missed or skipped')}</span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-lg" aria-hidden="true">↻</span>
              </motion.button>
            )}

            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5 shadow-sm sm:p-6">
              <p className="text-sm font-black text-sky-950">{tr('continue_learning', 'Continue learning')}</p>
              <p className="mt-1 text-xs leading-5 text-sky-800">{tr('continue_hint', 'Choose a topic with available questions.')}</p>
              <div className="mt-4 space-y-3">
                <button onClick={() => repeatTopic && window.location.assign(practiceUrl(repeatTopic.id))} disabled={isCheckingTopics || !repeatTopic} className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-white px-4 text-left text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-sky-400">
                  <span>
                    <span className="block">{isCheckingTopics ? tr('checking_topic', 'Checking this topic…') : repeatTopic ? tr('repeat_topic', 'Repeat: :name', { name: repeatTopic.name }) : tr('repeat_unavailable', 'Repeat unavailable')}</span>
                    <span className="mt-0.5 block text-xs font-medium text-slate-500">{tr('repeat_hint', 'Practise this same topic or subtopic again')}</span>
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-100 text-base text-sky-700" aria-hidden="true">↻</span>
                </button>
                <button onClick={() => nextTopic && window.location.assign(practiceUrl(nextTopic.id))} disabled={isCheckingTopics || !nextTopic} className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-sky-600 px-4 text-left text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2">
                  <span>
                    <span className="block">{isCheckingTopics ? tr('checking_next', 'Checking next topic…') : nextTopic ? tr('next_topic', 'Next: :name', { name: nextTopic.name }) : tr('no_next', 'No next topic available')}</span>
                    <span className="mt-0.5 block text-xs font-medium text-sky-100">{nextTopic?.is_subtopic ? tr('next_subtopic_hint', 'Continue with the next subtopic') : tr('next_topic_hint', 'Continue with the next topic')}</span>
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-base" aria-hidden="true">→</span>
                </button>
              </div>
              {!isCheckingTopics && (!repeatTopic || !nextTopic) && <p className="mt-3 text-xs leading-5 text-slate-500">{tr('topics_disabled_note', 'Topics without active, published questions are disabled or skipped automatically.')}</p>}
            </div>
          </motion.aside>
        </section>
      </div>
    </main>
  );
}
