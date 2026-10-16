import { useLanguage } from '@/Contexts/LanguageContext';

// Shared by authentication and public marketing pages; uses the same session setting.
export default function LanguageSwitch({ englishLabel = 'EN' }) {
    const { locale, changeLanguage, isChangingLanguage } = useLanguage();
    return (
        <div role="group" aria-label={locale === 'ms' ? 'Bahasa' : 'Language'} aria-busy={isChangingLanguage} className="flex shrink-0 rounded-full border border-slate-200 bg-white/90 p-0.5 text-sm font-semibold shadow-sm backdrop-blur">
            {[['en', englishLabel, 'English'], ['ms', 'BM', 'Bahasa Melayu']].map(([code, label, name]) => (
                <button key={code} type="button" disabled={isChangingLanguage} aria-pressed={locale === code} title={name} onClick={() => changeLanguage(code)} className={`rounded-full px-3 py-1.5 transition ${locale === code ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
            ))}
        </div>
    );
}
