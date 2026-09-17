import { router } from '@inertiajs/react';
import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }

    return context;
};

export const LanguageProvider = ({ children, pageProps = {} }) => {
    const [language, setLanguage] = useState({
        locale: pageProps.locale || 'en',
        translations: pageProps.translations || {},
        availableLocales: pageProps.availableLocales || ['en', 'ms'],
    });
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);

    const changeLanguage = (newLocale) => {
        if (newLocale === language.locale || isChangingLanguage) {
            return;
        }

        setIsChangingLanguage(true);

        router.post('/change-language', { locale: newLocale }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            onSuccess: (page) => {
                setLanguage({
                    locale: page.props.locale || newLocale,
                    translations: page.props.translations || {},
                    availableLocales: page.props.availableLocales || ['en', 'ms'],
                });
            },
            onError: () => {
                // The existing language stays selected if the server rejects the request.
            },
            onFinish: () => setIsChangingLanguage(false),
        });
    };

    const t = (key, fallback = '') => {
        const resolve = (translations) => key.split('.').reduce((current, segment) => current?.[segment], translations);
        const value = resolve(language.translations) ?? resolve(language.translations.common || {});

        return typeof value === 'string' ? value : fallback || key;
    };

    return (
        <LanguageContext.Provider value={{
            locale: language.locale,
            translations: language.translations,
            availableLocales: language.availableLocales,
            changeLanguage,
            t,
            isChangingLanguage,
            isEnglish: language.locale === 'en',
            isMalay: language.locale === 'ms',
        }}>
            {children}
        </LanguageContext.Provider>
    );
};
