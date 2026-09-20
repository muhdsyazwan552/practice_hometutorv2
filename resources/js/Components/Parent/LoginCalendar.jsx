import { ClockIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, DeviceTabletIcon } from '@heroicons/react/24/outline';
import { vizTokens } from '@/utils/parentChartTokens';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const deviceIcons = {
    mobile: DevicePhoneMobileIcon,
    tablet: DeviceTabletIcon,
    desktop: ComputerDesktopIcon,
};

/** Ordinal ramp: more sign-ins that day reads darker, one hue throughout. */
function cellStyle(logins) {
    if (! logins) {
        return { backgroundColor: vizTokens.surface, color: vizTokens.textMuted, boxShadow: `inset 0 0 0 1px ${vizTokens.grid}` };
    }

    const step = logins >= 3 ? 2 : logins - 1;

    return {
        backgroundColor: vizTokens.loginRamp[step],
        // White ink on the two darker steps, dark ink on the lightest.
        color: step === 0 ? vizTokens.textPrimary : '#ffffff',
    };
}

export default function LoginCalendar({ months = [], history = [] }) {
    const grouped = history.reduce((groups, entry) => {
        const bucket = groups.find((group) => group.date === entry.date);
        if (bucket) {
            bucket.entries.push(entry);
        } else {
            groups.push({ date: entry.date, label: entry.date_label, entries: [entry] });
        }

        return groups;
    }, []);

    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(8,44,88,0.07)]">
            <div className="border-b border-slate-100 p-4 sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0788c9]">Attendance</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#082c58] sm:text-xl">
                    When your child signs in
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    The last three months. A darker day means more sign-ins that day.
                </p>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <div className="p-4 sm:p-6">
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {months.map((month) => (
                            <div key={month.key}>
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-sm font-extrabold text-[#082c58]">{month.label}</p>
                                    <p className="text-xs font-semibold text-slate-400">
                                        {month.total_logins} {month.total_logins === 1 ? 'login' : 'logins'}
                                    </p>
                                </div>

                                <div className="mt-3 grid grid-cols-7 gap-1">
                                    {WEEKDAYS.map((day, index) => (
                                        <span
                                            key={`${month.key}-head-${index}`}
                                            className="pb-1 text-center text-[10px] font-bold text-slate-400"
                                        >
                                            {day}
                                        </span>
                                    ))}
                                    {Array.from({ length: month.lead_blanks }).map((_, index) => (
                                        <span key={`${month.key}-blank-${index}`} />
                                    ))}
                                    {month.days.map((day) => (
                                        <span
                                            key={day.date}
                                            title={`${day.date}: ${day.logins} ${day.logins === 1 ? 'login' : 'logins'}`}
                                            style={cellStyle(day.logins)}
                                            className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-bold tabular-nums ${
                                                day.is_today ? 'ring-2 ring-[#f2c237] ring-offset-1' : ''
                                            }`}
                                        >
                                            {day.day}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <span>No login</span>
                        <span className="h-4 w-4 rounded-md" style={cellStyle(0)} />
                        <span className="h-4 w-4 rounded-md" style={cellStyle(1)} />
                        <span className="h-4 w-4 rounded-md" style={cellStyle(2)} />
                        <span className="h-4 w-4 rounded-md" style={cellStyle(3)} />
                        <span>3 or more</span>
                        <span className="ml-2 inline-flex items-center gap-1.5">
                            <span className="h-4 w-4 rounded-md ring-2 ring-[#f2c237] ring-offset-1" style={cellStyle(0)} />
                            Today
                        </span>
                    </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-6 lg:border-l lg:border-t-0">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-slate-400" />
                        <h3 className="text-sm font-extrabold text-[#082c58]">Login history</h3>
                    </div>

                    {grouped.length ? (
                        <ol className="mt-4 max-h-[26rem] space-y-4 overflow-y-auto pr-1">
                            {grouped.map((group) => (
                                <li key={group.date}>
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                                        {group.label}
                                    </p>
                                    <ul className="mt-2 space-y-1.5">
                                        {group.entries.map((entry, index) => {
                                            const Icon = deviceIcons[entry.device] || ComputerDesktopIcon;

                                            return (
                                                <li
                                                    key={`${group.date}-${index}`}
                                                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-sm"
                                                >
                                                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                                                    <span className="font-bold tabular-nums text-slate-700">
                                                        {entry.time}
                                                    </span>
                                                    <span className="ml-auto text-xs capitalize text-slate-400">
                                                        {entry.device}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="mt-4 rounded-xl bg-white px-4 py-8 text-center text-sm font-semibold text-slate-400">
                            No sign-ins recorded yet.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
