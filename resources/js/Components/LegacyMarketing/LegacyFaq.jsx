import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import sourceCategories from './faq-content.json';
import useMarketingCopy from './useMarketingCopy';
import '../../../css/legacy-faq.css';

const subtitles = { aboutHomeTutor: 'Discover the platform', aboutJoinUs: 'Register, subscribe and renew', aboutContent: 'Practice, classes and games', accountSupport: 'Access, email and payments', returnPolicy: 'Policy and refund requests' };

function selectedFromUrl() {
    const requested = new URLSearchParams(window.location.search).get('tab');
    return sourceCategories.some(category => category.id === requested) ? requested : sourceCategories[0].id;
}

export default function LegacyFaq() {
    const { t, html, locale } = useMarketingCopy();
    const categories = sourceCategories.map(category => ({ ...category, title: t(category.title), items: category.items.map(item => ({ question: t(item.question), answerHtml: locale === 'ms' && item.answerHtmlMs ? item.answerHtmlMs : html(item.answerHtml) })) }));
    const [selected, setSelected] = useState(selectedFromUrl);
    const [query, setQuery] = useState('');
    useEffect(() => setQuery(''), [locale]);
    const current = categories.find(category => category.id === selected);
    const matches = query.trim().toLowerCase();
    const visible = matches ? categories.flatMap(category => category.items.map(item => ({ ...item, category: category.title }))).filter(item => `${item.question} ${item.answerHtml.replace(/<[^>]+>/g, ' ')}`.toLowerCase().includes(matches)) : current.items;

    useEffect(() => {
        const syncLocation = () => {
            setSelected(selectedFromUrl());
            setQuery('');
            if (window.location.hash === '#legacy-faq-content') {
                requestAnimationFrame(() => document.getElementById('legacy-faq-content')?.scrollIntoView({ block: 'start' }));
            }
        };
        syncLocation();
        window.addEventListener('popstate', syncLocation);
        const stop = router.on('navigate', syncLocation);
        return () => { window.removeEventListener('popstate', syncLocation); stop(); };
    }, []);

    function selectCategory(id) {
        setSelected(id);
        setQuery('');
        const url = new URL(window.location.href);
        url.searchParams.set('tab', id);
        window.history.replaceState(window.history.state, '', url);
    }

    return (
        <div className="legacy-faq">
            <section className="legacy-faq-intro">
                <p className="legacy-page-eyebrow">FAQ</p>
                <h1>{t('What can we help you with?')}</h1>
                <label className="legacy-faq-search"><span className="sr-only">{t('Search frequently asked questions')}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input type="search" placeholder={t("Enter a keyword or topic")} value={query} onChange={event => setQuery(event.target.value)} /></label>
            </section>
            <div className="legacy-faq-layout">
                <nav className="legacy-faq-categories" aria-label={t("FAQ categories")}>{categories.map(category => <button type="button" key={category.id} aria-pressed={!matches && selected === category.id} aria-controls="legacy-faq-content" onClick={() => selectCategory(category.id)}><span>{category.title}<small>{t(subtitles[category.id])}</small></span><span aria-hidden="true">↗</span></button>)}</nav>
                <section className="legacy-faq-content" id="legacy-faq-content" aria-label={matches ? t('Search results') : current.title}>
                    <h2>{matches ? t('Search results') : current.title}</h2>
                    {visible.length === 0 && <p className="legacy-faq-empty" role="status">{t('No matching questions. Try another keyword.')}</p>}
                    {visible.map(item => <article className="legacy-faq-item" key={item.question}>{matches && <p className="legacy-faq-result-category">{item.category}</p>}<h3>{item.question}</h3><div className="legacy-faq-answer" dangerouslySetInnerHTML={{ __html: item.answerHtml }} /></article>)}
                </section>
            </div>
        </div>
    );
}
