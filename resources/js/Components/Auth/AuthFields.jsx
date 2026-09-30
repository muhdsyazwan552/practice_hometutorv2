import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { useLanguage } from '@/Contexts/LanguageContext';

/**
 * Labelled input with a leading icon, sized for easy reading (16px text, tall touch target).
 * Password fields get an eye button so children and parents can check what they typed.
 */
export function AuthField({ id, label, icon: Icon, value, onChange, error, inputClassName = '', type = 'text', ...props }) {
    const { t } = useLanguage();
    const [shown, setShown] = useState(false);
    const isPassword = type === 'password';

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>
            <div className="relative mt-2">
                <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <TextInput
                    id={id}
                    name={id}
                    type={isPassword && shown ? 'text' : type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`block w-full rounded-xl border-slate-200 bg-white py-3 pl-11 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 ${isPassword ? 'pr-12' : 'pr-4'} ${inputClassName}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShown(!shown)}
                        aria-label={shown ? t('auth_page.hide_password', 'Hide password') : t('auth_page.show_password', 'Show password')}
                        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        {shown ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                )}
            </div>
            <InputError message={error} className="mt-2" />
        </div>
    );
}

/** Full-width primary action, the same dark pill as the landing page's main button. */
export function AuthSubmit({ children, disabled, className = 'bg-slate-900 hover:bg-slate-800' }) {
    return (
        <button
            type="submit"
            disabled={disabled}
            className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-base font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,23,42,.5)] transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${className}`}
        >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative flex items-center gap-2">{children}</span>
        </button>
    );
}
