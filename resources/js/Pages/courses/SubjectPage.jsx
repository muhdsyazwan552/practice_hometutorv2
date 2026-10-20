import { useEffect, useRef, useState } from 'react';
import SubjectLayout from '@/Layouts/SubjectLayout';
import ThemeLoader from '@/Components/ThemeLoader';
import { Head, router, usePage } from '@inertiajs/react';
import { useLanguage } from '@/Contexts/LanguageContext';
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
  const { locale } = useLanguage();
  const tr = (en, ms) => locale === 'ms' ? ms : en;
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
    studentTheme,
  } = props;
  const showDevelopmentIds = props.auth?.user?.email === 'tasya@children.hometutor.local';

  const themeSlug = studentTheme?.slug || 'ocean-blue';
  const themeCardRadius = themeSlug === 'brick-builders' ? 'rounded-xl' : themeSlug === 'robo-lab' ? 'rounded-2xl' : themeSlug === 'cat-club' || themeSlug === 'candy-garden' ? 'rounded-[2rem]' : 'rounded-3xl';
  const themeSurface = {
    background: 'color-mix(in srgb, var(--theme-card) 92%, var(--theme-accent) 8%)',
    borderColor: 'color-mix(in srgb, var(--theme-accent) 22%, white)',
  };
  const themeSoftSurface = {
    background: 'color-mix(in srgb, var(--theme-card) 84%, var(--theme-accent) 16%)',
    borderColor: 'color-mix(in srgb, var(--theme-accent) 28%, white)',
  };

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
    return <SubjectLayout subject={subject} selectedStandard={currentStandard}><ThemeLoader message={tr('Loading course topics…', 'Sedang memuatkan topik kursus…')} /></SubjectLayout>;
  }

  return (
    <SubjectLayout subject={subject} onStandardChange={handleStandardChange} selectedStandard={currentStandard} availableLevels={availableLevels}>
      <Head title={`${subject} ${tr('Course', 'Kursus')}`} />
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className={`${themeCardRadius} border p-5 shadow-sm`} style={themeSurface}>
            <div className="flex items-center gap-3"><span className="rounded-2xl p-3 text-white shadow-md" style={{ background: 'var(--theme-accent)' }}><BookOpenIcon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-accent)' }}>{tr('Learning chapters', 'Bab pembelajaran')}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{sections.length}</p><p className="text-xs text-slate-500">{tr('Follow each step', 'Ikut langkah demi langkah')}</p></div></div>
          </div>
          <div className={`${themeCardRadius} border p-5 shadow-sm`} style={themeSurface}>
            <div className="flex items-center gap-3"><span className="rounded-2xl p-3 text-white shadow-md" style={{ background: 'var(--theme-hero)' }}><DocumentTextIcon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-accent)' }}>{tr('Practice topics', 'Topik latihan')}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{totalLessons}</p><p className="text-xs text-slate-500">{tr('Objective and written answers', 'Objektif & jawapan bertulis')}</p></div></div>
          </div>
          <div className={`${themeCardRadius} border p-5 shadow-sm`} style={themeSurface}>
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-2xl p-3 text-white shadow-md" style={{ background: 'var(--theme-accent)' }}><CheckCircleIcon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-accent)' }}>{tr('Your progress', 'Kemajuan anda')}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{progress}%</p><p className="text-xs text-slate-500">{completedLessons}/{totalLessons} {tr('topics mastered', 'topik dikuasai')}</p></div></div><div className="grid h-14 w-14 place-items-center rounded-full p-1.5" style={{ background: `conic-gradient(var(--theme-accent) ${progress * 3.6}deg, color-mix(in srgb, var(--theme-accent) 16%, white) 0deg)` }}><div className="grid h-full w-full place-items-center rounded-full bg-white text-xs font-extrabold" style={{ color: 'var(--theme-accent)' }}>{progress}%</div></div></div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-[145px]">
            <div className={`overflow-hidden border shadow-sm ${themeCardRadius}`} style={themeSurface}>
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{tr('Course contents', 'Kandungan kursus')}</p>
                <p className="mt-1 text-sm text-slate-500">{tr('Jump to a section', 'Pergi ke bahagian')}</p>
              </div>
              <nav className="max-h-[520px] space-y-1 overflow-y-auto p-2">
                {sections.map((section, index) => (
                  <button key={section.id} onClick={() => scrollToSection(section.title)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${activeSection === section.title ? 'font-semibold' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} style={activeSection === section.title ? { background: 'color-mix(in srgb, var(--theme-accent) 12%, white)', color: 'var(--theme-accent)' } : undefined}>
                    <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg text-[10px] font-bold ${activeSection === section.title ? 'text-white' : 'bg-slate-100 text-slate-500'}`} style={activeSection === section.title ? { background: 'var(--theme-accent)' } : undefined}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="line-clamp-2 leading-6">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-6">
            {!sections.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><BookOpenIcon className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">{tr('No course modules are available yet.', 'Belum ada modul kursus tersedia.')}</p></div>
            ) : sections.map((section, sectionIndex) => {
              const sectionModules = section.subSections || [];
              const sectionCompleted = sectionModules.filter((item) => item.lastPractice?.objective?.score >= 70 || item.lastPractice?.subjective?.score >= 70).length;
              const sectionProgress = sectionModules.length ? Math.round((sectionCompleted / sectionModules.length) * 100) : 0;

              return (
              <section key={section.id} id={section.title} ref={(element) => { sectionRefs.current[section.title] = element; }} className={`scroll-mt-40 overflow-hidden border shadow-sm ${themeCardRadius}`} style={themeSurface}>
                <header className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'var(--theme-hero)' }}>{String(sectionIndex + 1).padStart(2, '0')}</span>
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-accent)' }}>{tr('Chapter', 'Bab')} {sectionIndex + 1}</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">{section.title}</h2>{showDevelopmentIds && <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-900">{tr('Topic ID', 'ID topik')}: {section.topicId}</span>}</div>
                  </div>
                  <span className="w-fit rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--theme-accent) 12%, white)', color: 'var(--theme-accent)' }}>{section.subSections?.length || 0} {tr('practice topics', 'topik latihan')}</span>
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
                            <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{tr('Topic', 'Topik')} {moduleIndex + 1}</p><h3 className="mt-0.5 font-extrabold text-slate-900">{subSection.title}</h3>{showDevelopmentIds && subSection.isSubtopic && <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-900">{tr('Subtopic ID', 'ID subtopik')}: {subSection.id}</span>}<p className="mt-1 text-xs text-slate-500">{subSection.questionCounts?.objective || 0} {tr('objective questions', 'soalan objektif')} · {subSection.questionCounts?.subjective || 0} {tr('written questions', 'soalan bertulis')}</p></div>
                          </div>
                          {completed && <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">✓ {tr('Mastered', 'Sudah dikuasai')}</span>}
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          {subSection.questionCounts?.objective > 0 && (
                            <div className={`group/card relative overflow-hidden border p-5 transition hover:-translate-y-1 hover:shadow-lg ${themeCardRadius}`} style={themeSoftSurface}>
                              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ background: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)' }} />
                              <div className="flex items-start justify-between">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: 'var(--theme-hero)' }}>
                                  <DocumentTextIcon className="h-6 w-6" />
                                </span>
                                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, white)', color: 'var(--theme-accent)' }}>{subSection.questionCounts.objective} {tr('questions', 'soalan')}</span>
                              </div>
                              <h4 className="mt-4 text-base font-extrabold text-slate-900">{tr('Objective Practice', 'Latihan Objektif')}</h4>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{tr('Choose the best answer and get instant feedback for', 'Pilih jawapan terbaik dan dapatkan semakan serta-merta untuk')} {subSection.practiceTitle || tr('this topic', 'topik ini')}.</p>
                              <div className="mt-4 rounded-2xl bg-white/80 p-3 ring-1" style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 18%, white)' }}>
                                {subSection.lastPractice?.objective ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-slate-500">{tr('Last practice score', 'Skor latihan terakhir')}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${objectiveCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {objectiveCompleted && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                      {subSection.lastPractice.objective.score}% · {subSection.lastPractice.objective.total_correct}/{subSection.lastPractice.objective.total_questions} {tr('correct', 'betul')}
                                    </span></div>
                                    <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                      <ClockIcon className="h-3.5 w-3.5" /> {tr('Last attempt', 'Kali terakhir')}: {subSection.lastPractice.objective.last_practice_at}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[11px] font-semibold text-slate-500">{tr('Not attempted yet — start to see your score.', 'Belum cuba lagi — mulakan untuk lihat skor anda.')}</p>
                                )}
                              </div>
                              <button
                                onClick={() => startPractice('objective-page', section, subSection)}
                                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 group-hover/card:shadow-md"
                                style={{ background: 'var(--theme-hero)' }}
                              >
                                {objectiveCompleted ? tr('Try again', 'Cuba semula') : tr('Start practice', 'Mula latihan')}
                                <ArrowRightIcon className="h-4 w-4 transition group-hover/card:translate-x-0.5" />
                              </button>
                            </div>
                          )}
                          {subSection.questionCounts?.subjective > 0 && (
                            <div className={`group/card relative overflow-hidden border p-5 transition hover:-translate-y-1 hover:shadow-lg ${themeCardRadius}`} style={themeSoftSurface}>
                              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ background: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)' }} />
                              <div className="flex items-start justify-between">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: 'var(--theme-accent)' }}>
                                  <PencilSquareIcon className="h-6 w-6" />
                                </span>
                                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, white)', color: 'var(--theme-accent)' }}>{subSection.questionCounts.subjective} {tr('questions', 'soalan')}</span>
                              </div>
                              <h4 className="mt-4 text-base font-extrabold text-slate-900">{tr('Written Practice', 'Latihan Bertulis')}</h4>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{tr('Write clear answers and steps to strengthen your understanding.', 'Tulis jawapan dengan langkah yang jelas untuk mengukuhkan pemahaman anda.')}</p>
                              <div className="mt-4 rounded-2xl bg-white/80 p-3 ring-1" style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 18%, white)' }}>
                                {subSection.lastPractice?.subjective ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-slate-500">{tr('Last practice score', 'Skor latihan terakhir')}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${subjectiveCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {subjectiveCompleted && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                      {subSection.lastPractice.subjective.score}% · {subSection.lastPractice.subjective.total_correct}/{subSection.lastPractice.subjective.total_questions} {tr('correct', 'betul')}
                                    </span></div>
                                    <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                      <ClockIcon className="h-3.5 w-3.5" /> {tr('Last attempt', 'Kali terakhir')}: {subSection.lastPractice.subjective.last_practice_at}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[11px] font-semibold text-slate-500">{tr('Not attempted yet — write your first answer.', 'Belum cuba lagi — tulis jawapan pertama anda.')}</p>
                                )}
                              </div>
                              <button
                                onClick={() => startPractice('subjective-page', section, subSection)}
                                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 group-hover/card:shadow-md"
                                style={{ background: 'var(--theme-accent)' }}
                              >
                                {subjectiveCompleted ? tr('Try again', 'Cuba semula') : tr('Start writing', 'Mula menulis')}
                                <ArrowRightIcon className="h-4 w-4 transition group-hover/card:translate-x-0.5" />
                              </button>
                            </div>
                          )}
                          {!subSection.questionCounts?.objective && !subSection.questionCounts?.subjective && (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">{tr('Practice content is coming soon.', 'Kandungan latihan akan datang.')}</div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/70 px-5 py-3.5 sm:px-6" style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, white)' }}>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><SparklesIcon className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} /> {sectionCompleted} {tr('of', 'daripada')} {sectionModules.length} {tr('topics mastered', 'topik telah dikuasai')}</span>
                  <div className="flex items-center gap-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${sectionProgress}%`, background: 'var(--theme-hero)' }} /></div><span className="text-xs font-extrabold" style={{ color: 'var(--theme-accent)' }}>{sectionProgress}%</span></div>
                </footer>
              </section>
              );
            })}
          </div>
        </div>
      </div>
    </SubjectLayout>
  );
}
