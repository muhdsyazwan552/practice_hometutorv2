import { useLanguage } from '@/Contexts/LanguageContext';

const LanguageSwitcher = ({ type = 'buttons' }) => {
    const { locale, changeLanguage, isChangingLanguage } = useLanguage();

    if (type === 'dropdown') {
        return (
            <label className="relative block">
                <span className="sr-only">Choose language</span>
                <select
                    value={locale}
                    onChange={(event) => changeLanguage(event.target.value)}
                    disabled={isChangingLanguage}
                    className="h-10 max-w-24 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-7 text-xs font-bold text-slate-600 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200 disabled:cursor-wait disabled:opacity-70"
                >
                    <option value="en">EN</option>
                    <option value="ms">BM</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">⌄</span>
            </label>
        );
    }

    return (
        <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm" aria-label="Choose language">
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
                        className={`relative min-w-10 rounded-lg px-2.5 py-1.5 text-xs font-extrabold tracking-wide transition-all duration-200 disabled:cursor-default ${isActive ? 'bg-[#087bb8] text-white shadow-[0_3px_8px_rgba(8,123,184,.28)]' : 'text-slate-500 hover:bg-white hover:text-[#087bb8] disabled:opacity-100'}`}
                    >
                        {language.label}
                    </button>
                );
            })}
            {isChangingLanguage && <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-200 border-t-[#087bb8]" aria-label="Changing language" />}
        </div>
    );
};

export default LanguageSwitcher;
