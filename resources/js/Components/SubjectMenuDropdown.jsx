import { Link, usePage } from '@inertiajs/react';
import { AcademicCapIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function SubjectMenuDropdown({ isOpen, setIsOpen, onToggle, variant = 'default' }) {
    const schoolSubjects = usePage().props.schoolSubjects || [];
    const { t } = useLanguage();
    const compact = variant === 'compact';

    const getSubjectUrl = (subject) => {
        const subjectSlug = subject.abbr || subject.name.toLowerCase().replace(/\s+/g, '-');

        // The backend picks the form from level_id, so full-access accounts
        // land on the subject's own level instead of a hardcoded Form 4/5.
        return `/subject/${subjectSlug}?subject_id=${subject.id}&level_id=${subject.level_id}`;
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
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${compact ? (isOpen ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white') : (isOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
            >
                <AcademicCapIcon className="h-4 w-4" />
                <span>{t('courses', 'Courses')}</span>
                <ChevronDownIcon className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Fixed + viewport-clamped on mobile: the toggle button sits near
                the left edge of the navbar, so anchoring this panel with
                `left-0` and a width based on 100vw made it spill off the
                right edge of narrow screens (and contributed to horizontal
                page overflow even while closed). From `sm:` up there's
                enough room for the normal button-anchored dropdown. */}
            <div className={`fixed inset-x-3 top-16 z-[60] max-h-[70vh] origin-top overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl shadow-slate-950/40 transition duration-200 sm:absolute sm:inset-x-auto sm:left-0 sm:top-[calc(100%+0.75rem)] sm:max-h-none sm:w-72 sm:origin-top-left ${isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}>
                <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Your subjects</div>
                <div className="max-h-80 overflow-y-auto">
                    {schoolSubjects.map((subject) => (
                        <Link key={subject.id} href={getSubjectUrl(subject)} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><AcademicCapIcon className="h-4 w-4" /></span>
                            <span className="truncate">{subject.name}</span>
                        </Link>
                    ))}
                    {schoolSubjects.length === 0 && <p className="px-3 py-5 text-sm text-slate-400">No subjects available yet.</p>}
                </div>
            </div>
        </div>
    );
}
