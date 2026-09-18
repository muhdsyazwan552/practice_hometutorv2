import { useEffect, useRef, useState } from 'react';
import SubjectLayout from '@/Layouts/SubjectLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function SubjectPage({ selectedStandard }) {
  const { props } = usePage();
  const {
    subject,
    subject_abbr,
    content,
    form,
    subject_id,
    level_id,
    availableLevels,
    availableSubjects,
  } = props;

  const [currentStandard, setCurrentStandard] = useState(selectedStandard || form || 'Form 4');
  const [activeSection, setActiveSection] = useState('');
  const sectionRefs = useRef({});
  const currentContent = content || { id: 0, sections: [] };
  const sections = currentContent.sections || [];

  useEffect(() => {
    if (sections.length && !activeSection) setActiveSection(sections[0].title);
  }, [sections, activeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: '-35% 0px -50% 0px', threshold: [0.1, 0.4, 0.7] });
    sections.forEach((section) => sectionRefs.current[section.title] && observer.observe(sectionRefs.current[section.title]));
    return () => observer.disconnect();
  }, [sections]);

  const handleStandardChange = (standard) => {
    setCurrentStandard(standard);
    router.get(route('subject-page', {
      subject: subject_abbr || subject,
      form: standard,
      level_id: availableLevels?.[standard] || level_id,
      subject_id: availableSubjects?.[standard] || subject_id,
    }));
  };

  const scrollToSection = (title) => {
    setActiveSection(title);
    const element = document.getElementById(title);
    if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 145, behavior: 'smooth' });
  };

  const startPractice = (routeName, section, subSection) => {
    router.get(route(routeName), {
      subject,
      standard: currentStandard,
      sectionId: section.id,
      sectionTitle: section.title,
      contentId: currentContent.id,
      topic: subSection.title,
      topic_id: subSection.id,
      subject_id,
      level_id,
    });
  };

  const totalLessons = sections.reduce((sum, section) => sum + (section.subSections?.length || 0), 0);
  const completedLessons = sections.reduce((sum, section) => sum + (section.subSections || []).filter((item) => item.lastPractice?.objective?.score >= 70 || item.lastPractice?.subjective?.score >= 70).length, 0);
  const progress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (!content) {
    return <SubjectLayout subject={subject} selectedStandard={currentStandard}><div className="mx-auto max-w-[1440px] px-4 py-20 text-center text-sm text-slate-500">Loading course content…</div></SubjectLayout>;
  }

  return (
    <SubjectLayout subject={subject} onStandardChange={handleStandardChange} selectedStandard={currentStandard} availableLevels={availableLevels}>
      <Head title={`${subject} Course`} />
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><BookOpenIcon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-400">Course sections</p><p className="mt-0.5 text-lg font-semibold text-slate-900">{sections.length}</p></div></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600"><DocumentTextIcon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-400">Learning modules</p><p className="mt-0.5 text-lg font-semibold text-slate-900">{totalLessons}</p></div></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><CheckCircleIcon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-400">Course progress</p><p className="mt-0.5 text-lg font-semibold text-slate-900">{progress}%</p></div></div><div className="h-10 w-10 rounded-full border-4 border-emerald-100 border-t-emerald-500" /></div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-[145px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Course contents</p>
                <p className="mt-1 text-sm text-slate-500">Jump to a section</p>
              </div>
              <nav className="max-h-[520px] space-y-1 overflow-y-auto p-2">
                {sections.map((section, index) => (
                  <button key={section.id} onClick={() => scrollToSection(section.title)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${activeSection === section.title ? 'bg-indigo-50 font-semibold text-indigo-700' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg text-[10px] font-bold ${activeSection === section.title ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="line-clamp-2 leading-6">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-6">
            {!sections.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><BookOpenIcon className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">No course modules are available yet.</p></div>
            ) : sections.map((section, sectionIndex) => (
              <section key={section.id} id={section.title} ref={(element) => { sectionRefs.current[section.title] = element; }} className="scroll-mt-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">{String(sectionIndex + 1).padStart(2, '0')}</span>
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Section {sectionIndex + 1}</p><h2 className="mt-1 text-lg font-semibold text-slate-900">{section.title}</h2></div>
                  </div>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{section.subSections?.length || 0} modules</span>
                </header>

                <div className="divide-y divide-slate-100">
                  {(section.subSections || []).map((subSection, moduleIndex) => {
                    const objectiveCompleted = subSection.lastPractice?.objective?.score >= 70;
                    const subjectiveCompleted = subSection.lastPractice?.subjective?.score >= 70;
                    const completed = objectiveCompleted || subjectiveCompleted;
                    return (
                      <article key={subSection.id} className="p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg ${completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{completed ? <CheckCircleIcon className="h-5 w-5" /> : <span className="text-xs font-bold">{moduleIndex + 1}</span>}</span>
                            <div><h3 className="font-semibold text-slate-900">{subSection.title}</h3><p className="mt-1 text-xs text-slate-400">{subSection.questionCounts?.objective || 0} objective · {subSection.questionCounts?.subjective || 0} written questions</p></div>
                          </div>
                          {completed && <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Completed</span>}
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          {subSection.questionCounts?.objective > 0 && (
                            <div className="group/card relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-white p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-100">
                              <div className="flex items-start justify-between">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-400 text-white shadow-sm shadow-indigo-200">
                                  <DocumentTextIcon className="h-6 w-6" />
                                </span>
                                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{subSection.questionCounts.objective} questions</span>
                              </div>
                              <h4 className="mt-4 text-base font-bold text-slate-900">Objective practice</h4>
                              <p className="mt-1 text-xs text-slate-500">{subSection.practiceTitle || 'Test your understanding of this topic.'}</p>
                              <div className="mt-4 space-y-1.5">
                                {subSection.lastPractice?.objective ? (
                                  <>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${objectiveCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {objectiveCompleted && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                      {subSection.lastPractice.objective.total_correct}/{subSection.lastPractice.objective.total_questions} correct
                                    </span>
                                    <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                      <ClockIcon className="h-3.5 w-3.5" /> Last practice: {subSection.lastPractice.objective.last_practice_at}
                                    </p>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-semibold text-slate-400">Not attempted yet</span>
                                )}
                              </div>
                              <button
                                onClick={() => startPractice('objective-page', section, subSection)}
                                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 group-hover/card:shadow-md"
                              >
                                {objectiveCompleted ? 'Try again' : 'Start practice'}
                                <ArrowRightIcon className="h-4 w-4 transition group-hover/card:translate-x-0.5" />
                              </button>
                            </div>
                          )}
                          {subSection.questionCounts?.subjective > 0 && (
                            <div className="group/card relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-white p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100">
                              <div className="flex items-start justify-between">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 text-white shadow-sm shadow-violet-200">
                                  <PencilSquareIcon className="h-6 w-6" />
                                </span>
                                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">{subSection.questionCounts.subjective} questions</span>
                              </div>
                              <h4 className="mt-4 text-base font-bold text-slate-900">Written practice</h4>
                              <p className="mt-1 text-xs text-slate-500">Build a stronger written response.</p>
                              <div className="mt-4 space-y-1.5">
                                {subSection.lastPractice?.subjective ? (
                                  <>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${subjectiveCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {subjectiveCompleted && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                      {subSection.lastPractice.subjective.total_correct}/{subSection.lastPractice.subjective.total_questions} correct
                                    </span>
                                    <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                      <ClockIcon className="h-3.5 w-3.5" /> Last practice: {subSection.lastPractice.subjective.last_practice_at}
                                    </p>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-semibold text-slate-400">Not attempted yet</span>
                                )}
                              </div>
                              <button
                                onClick={() => startPractice('subjective-page', section, subSection)}
                                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 group-hover/card:shadow-md"
                              >
                                {subjectiveCompleted ? 'Try again' : 'Start writing'}
                                <ArrowRightIcon className="h-4 w-4 transition group-hover/card:translate-x-0.5" />
                              </button>
                            </div>
                          )}
                          {!subSection.questionCounts?.objective && !subSection.questionCounts?.subjective && (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">Practice content is coming soon.</div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6"><span className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><SparklesIcon className="h-4 w-4 text-indigo-500" /> Section progress</span><div className="flex items-center gap-3"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-3/5 rounded-full bg-indigo-500" /></div><span className="text-xs font-semibold text-slate-600">60%</span></div></footer>
              </section>
            ))}
          </div>
        </div>
      </div>
    </SubjectLayout>
  );
}
