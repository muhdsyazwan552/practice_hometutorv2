import { useLanguage } from '@/Contexts/LanguageContext';

const LanguageSwitcher = ({ type = 'buttons', variant = 'default' }) => {
    const { locale, changeLanguage, isChangingLanguage } = useLanguage();
    const compact = variant === 'compact';
    const tr = (en, ms) => locale === 'ms' ? ms : en;

    if (type === 'dropdown') {
        return (
            <label className="relative block">
                <span className="sr-only">{tr('Choose language', 'Pilih bahasa')}</span>
                <select
                    value={locale}
                    onChange={(event) => changeLanguage(event.target.value)}
                    disabled={isChangingLanguage}
                    className={`h-10 max-w-24 appearance-none rounded-xl border px-3 pr-7 text-xs font-bold outline-none transition disabled:cursor-wait disabled:opacity-70 ${compact ? 'border-slate-600 bg-slate-800 text-white focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30' : 'border-slate-200 bg-white text-slate-600 focus:border-sky-300 focus:ring-2 focus:ring-sky-200'}`}
                >
                    <option value="en">EN</option>
                    <option value="ms">BM</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">⌄</span>
            </label>
        );
    }

    return (
        <div className={`inline-flex h-10 items-center rounded-xl border p-1 shadow-sm ${compact ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-slate-50'}`} aria-label={tr('Choose language', 'Pilih bahasa')}>
            {[
                { value: 'en', label: 'EN', name: 'English' },
                { value: 'ms', label: 'BM', name: 'Bahasa Melayu' },
            ].map((language) => {
                const isActive = locale === language.value;

                return (
                    <button
                        key={language.value}
                        type="button"
                        onClick={() => changeLanguage(language.value)}
                        disabled={isChangingLanguage || isActive}
                        aria-pressed={isActive}
                        title={language.name}
                        className={`relative min-w-10 rounded-lg px-2.5 py-1.5 text-xs font-extrabold tracking-wide transition-all duration-200 disabled:cursor-default ${isActive ? 'bg-sky-500 text-white shadow-[0_3px_8px_rgba(14,165,233,.35)]' : compact ? 'text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-100' : 'text-slate-500 hover:bg-white hover:text-[#087bb8] disabled:opacity-100'}`}
                    >
                        {language.label}
                    </button>
                );
            })}
            {isChangingLanguage && <span className={`mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 ${compact ? 'border-slate-500 border-t-cyan-300' : 'border-sky-200 border-t-[#087bb8]'}`} aria-label={tr('Changing language', 'Sedang menukar bahasa')} />}
        </div>
    );
};

export default LanguageSwitcher;
