import { Link, usePage } from '@inertiajs/react';
import { BookOpenIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function SubjectMenuDropdown({ isOpen, setIsOpen, title, onToggle }) {
    const schoolSubjects = usePage().props.schoolSubjects || [];
    const { t } = useLanguage();

    const getSubjectUrl = (subject) => {
        const subjectSlug = subject.abbr || subject.name.toLowerCase().replace(/\s+/g, '-');
        const form = subject.level_id === 10 ? 'Form 4' : 'Form 5';

        return `/subject/${subjectSlug}?subject_id=${subject.id}&level_id=${subject.level_id}&form=${encodeURIComponent(form)}`;
    };

    const toggleMenu = () => {
        onToggle?.();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={toggleMenu}
                aria-expanded={isOpen}
                className={`group inline-flex h-11 max-w-[7rem] items-center gap-2 rounded-2xl border px-2.5 text-left text-sm font-bold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white/80 sm:max-w-xs sm:px-3 ${isOpen ? 'border-white bg-[#082c58] text-white' : 'border-white/60 bg-white/95 text-[#082c58] hover:-translate-y-0.5 hover:bg-white'}`}
            >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[#087bb8] transition group-hover:bg-[#087bb8] group-hover:text-white"><BookOpenIcon className="h-4 w-4" /></span>
                <span className="min-w-0">
                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:block">{t('school_subject', 'Subject')}</span>
                    <span className="block truncate sm:text-xs lg:text-sm">{title || t('courses', 'Courses')}</span>
                </span>
                <ChevronDownIcon className={`hidden h-4 w-4 shrink-0 transition sm:block ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute left-0 top-[calc(100%+0.75rem)] z-[60] w-[min(34rem,calc(100vw-1.5rem))] origin-top-left rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/15 transition duration-200 ${isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}>
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#082c58] to-[#087bb8] px-4 py-3 text-white">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><BookOpenIcon className="h-5 w-5" /></span>
                    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-100">{t('school_subject', 'School subjects')}</p><p className="mt-0.5 text-sm font-medium">Switch subjects whenever you are ready.</p></div>
                </div>
                <div className="mt-2 grid max-h-[min(55vh,26rem)] grid-cols-1 gap-1 overflow-y-auto p-1 sm:grid-cols-2">
                    {schoolSubjects.map((subject) => (
                        <Link key={subject.id} href={getSubjectUrl(subject)} onClick={() => setIsOpen(false)} className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-[#087bb8]">
                            <span>{subject.name}</span>
                            <span className="text-xs text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#087bb8]">Open →</span>
                        </Link>
                    ))}
                    {schoolSubjects.length === 0 && <p className="col-span-full px-3 py-5 text-sm text-slate-500">{t('no_subjects_available', 'No subjects available')}</p>}
                </div>
            </div>
        </div>
    );
}
