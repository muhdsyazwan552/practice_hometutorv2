import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    ChartBarSquareIcon,
    ClipboardDocumentCheckIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';

/**
 * Shell for the three read-only pages a parent uses to look at one child.
 * The student navbar is deliberately absent here: a parent cannot practise,
 * open a subject or change a theme, so those controls would only mislead.
 * Navigation between the three views is the tab row instead.
 */
export default function ParentChildLayout({ children }) {
    const {
        viewedChild,
        activeTab,
        parentDashboardUrl,
        parentReportUrl,
        sessionHistoryUrl,
        returnToParentUrl,
    } = usePage().props;

    const tabs = [
        { key: 'dashboard', label: 'Dashboard', href: parentDashboardUrl, icon: Squares2X2Icon },
        { key: 'report-card', label: 'Report card', href: parentReportUrl, icon: ClipboardDocumentCheckIcon },
        { key: 'session-log', label: 'Session log', href: sessionHistoryUrl, icon: ChartBarSquareIcon },
    ].filter((tab) => Boolean(tab.href));

    const initials = (viewedChild?.name || 'HT')
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    return (
        <div className="min-h-screen bg-[#eff9ff] font-sans text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-10">
                    <a
                        href={returnToParentUrl || '/parent'}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-900"
                    >
                        <ArrowLeftIcon className="h-4 w-4" /> Back to parent dashboard
                    </a>

                    <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#082c58] text-sm font-extrabold text-white sm:h-14 sm:w-14 sm:text-base">
                            {initials}
                        </span>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-extrabold tracking-tight text-[#082c58] sm:text-2xl">
                                {viewedChild?.name || 'Child'}
                            </h1>
                            <p className="mt-0.5 truncate text-sm text-slate-500">
                                {viewedChild?.username ? `@${viewedChild.username}` : ''}
                                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                    Read only
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Horizontally scrollable on a phone so all three tabs stay reachable. */}
                    <nav className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Child views">
                        <div className="flex w-max min-w-full gap-1 border-b border-transparent">
                            {tabs.map((tab) => {
                                const current = tab.key === activeTab;

                                return (
                                    <Link
                                        key={tab.key}
                                        href={tab.href}
                                        aria-current={current ? 'page' : undefined}
                                        className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl border-b-[3px] px-3 py-3 text-sm font-bold transition sm:px-5 ${
                                            current
                                                ? 'border-[#0788c9] text-[#0788c9]'
                                                : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700'
                                        }`}
                                    >
                                        <tab.icon className="h-5 w-5 shrink-0" />
                                        {tab.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </header>

            {children}
        </div>
    );
}
