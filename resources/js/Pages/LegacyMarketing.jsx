import { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import HomeTutorChatbot from '@/Components/LegacyMarketing/HomeTutorChatbot';
import LanguageSwitch from '@/Components/Auth/LanguageSwitch';
import useMarketingCopy from '@/Components/LegacyMarketing/useMarketingCopy';
import LegacyHome from '@/Components/LegacyMarketing/LegacyHome';
import LegacyProducts from '@/Components/LegacyMarketing/LegacyProducts';
import LegacyAbout from '@/Components/LegacyMarketing/LegacyAbout';
import LegacyFaq from '@/Components/LegacyMarketing/LegacyFaq';
import { TermsOfUse, PrivacyPolicy } from '@/Components/LegacyMarketing/LegacyPolicy';
import '../../css/legacy-marketing.css';

const pages = [
    { id: 'home', label: 'Home', component: LegacyHome },
    { id: 'products', label: 'Produk', component: LegacyProducts },
    { id: 'about', label: 'Tentang Kami', component: LegacyAbout },
    { id: 'faq', label: 'FAQ', component: LegacyFaq },
    { id: 'terms', label: 'Terms of use', component: TermsOfUse },
    { id: 'privacy', label: 'Privacy Policy', component: PrivacyPolicy },
];
const navigation = [
    { label: 'Produk', href: '/products', page: 'products' },
    { label: 'Tentang Kami', href: '/about', page: 'about' },
    { label: 'FAQ', href: '/faq', page: 'faq' },
];

export default function LegacyMarketing({ section = 'home' }) {
    const { url } = usePage();
    const { t, locale } = useMarketingCopy();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuButton = useRef(null);
    const header = useRef(null);
    const page = pages.find(item => item.id === section) ?? pages[0];
    const Content = page.component;

    useEffect(() => { setMenuOpen(false); }, [url]);
    useEffect(() => {
        const updateScrolled = () => setScrolled(window.scrollY > 24);
        updateScrolled();
        window.addEventListener('scroll', updateScrolled, { passive: true });
        return () => window.removeEventListener('scroll', updateScrolled);
    }, []);
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeDesktopMenu = () => { if (desktop.matches) setMenuOpen(false); };
        desktop.addEventListener('change', closeDesktopMenu);
        return () => desktop.removeEventListener('change', closeDesktopMenu);
    }, []);
    useEffect(() => {
        if (!menuOpen) return;
        const closeOnEscape = event => {
            if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
        };
        const closeOutside = event => {
            if (!header.current?.contains(event.target)) setMenuOpen(false);
        };
        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('focusin', closeOutside);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('focusin', closeOutside);
        };
    }, [menuOpen]);

    const renderLink = item => {
        const NavLink = item.anchor ? 'a' : Link;
        return <NavLink {...(item.anchor ? {} : { preserveState: true })} key={item.href} href={item.href} aria-current={item.page === page.id ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{t(item.label)}</NavLink>;
    };

    return (
        <div className={`legacy-shell legacy-shell-${page.id}`}>
            <Head title={page.id === 'home' ? 'HomeTutor' : `${t(page.label)} | HomeTutor`}>
                <meta name="description" content={page.id === 'home' ? t('Give your child easy access to interactive online classes, engaging practice exercises, and essential learning resources—all in one convenient platform.') : t('Complete learning platform for Years 1 to Form 5. Enjoy 24/7 access, live classes, interactive practice and progress reports for parents.')} />
            </Head>
            <a className="legacy-skip" href="#main-content">{t('Skip to content')}</a>
            <header ref={header} className={`legacy-header${scrolled || menuOpen ? ' is-solid' : ''}`}>
                <div className="legacy-header-inner">
                    <Link preserveState href="/" className="legacy-logo" aria-label={t('HomeTutor home')} onClick={() => setMenuOpen(false)}><img src="/images/landing-practice/ht-logo.webp" alt="HomeTutor" height="40" /></Link>
                    <nav className="legacy-desktop-links" aria-label={t('Main navigation')}>{navigation.map(renderLink)}</nav>
                    <div className="legacy-account-links">
                        <div className="legacy-language-control"><LanguageSwitch englishLabel="ENG" /></div>
                        <Link preserveState className="legacy-login" href="/login" onClick={() => setMenuOpen(false)}>{t('Log masuk')}</Link>
                        <button type="button" ref={menuButton} className="legacy-menu-toggle" aria-expanded={menuOpen} aria-controls="legacy-navigation" aria-label={t(menuOpen ? 'Tutup menu' : 'Buka menu')} onClick={() => setMenuOpen(!menuOpen)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{menuOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}</svg></button>
                    </div>
                </div>
                {menuOpen && <nav id="legacy-navigation" className="legacy-mobile-links" aria-label={t('Mobile navigation')}>{navigation.map(renderLink)}<Link preserveState className="legacy-mobile-login" href="/login" onClick={() => setMenuOpen(false)}>{t('Log masuk')}</Link></nav>}
            </header>
            <main id="main-content" className="legacy-main" lang={locale} key={url} tabIndex="-1"><Content /></main>
            <footer className="legacy-footer">
                <div className="legacy-footer-inner">
                    <div className="legacy-footer-top">
                        <div className="legacy-footer-story"><Link preserveState href="/" aria-label={t('HomeTutor home')}><img src="/images/landing-practice/ht-logo.webp" alt="HomeTutor" height="40" /></Link><p>{t('HomeTutor provides teaching materials in the form of digital contents and mastery learning modules that can improve your achivement.')}</p><p>{t('We strive to enhance your learning process by doing some practice through exercise and provide your personalize information as a result.')}</p></div>
                        <div className="legacy-footer-links"><h2>{t('About')}</h2><Link preserveState href="/about">{t('Our Company')}</Link><Link preserveState href="/products">{t('Our Products')}</Link></div>
                        <div className="legacy-footer-links"><h2>{t('Support')}</h2><Link preserveState href="/faq">{t('FAQ')}</Link><Link preserveState href="/faq?tab=accountSupport">{t('Contact Us')}</Link></div>
                    </div>
                    <div className="legacy-footer-bottom"><p>© 2025 HomeTutor®</p><div className="legacy-legal"><Link preserveState href="/terms-of-use">{t('Terms of use')}</Link><Link preserveState href="/faq?tab=returnPolicy#legacy-faq-content">{t('Refund and Cancellation Policy')}</Link><Link preserveState href="/privacy-policy">{t('Privacy Policy')}</Link></div><div className="legacy-social"><a href="https://www.facebook.com/HomeTutorDL/" target="_blank" rel="noopener noreferrer">{t('Facebook')}</a><a href="https://www.instagram.com/hometutor.hq/" target="_blank" rel="noopener noreferrer">{t('Instagram')}</a><a href="https://www.youtube.com/channel/UC5AwwPcTLg0LtJTLrNXXatg/videos" target="_blank" rel="noopener noreferrer">{t('YouTube')}</a></div></div>
                </div>
            </footer>
            <HomeTutorChatbot />
        </div>
    );
}
