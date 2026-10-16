import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { useReducedMotion } from 'framer-motion';
import useMarketingCopy from './useMarketingCopy';
import '../../../css/marketing-chatbot.css';

const artwork = '/images/marketing-chatbot/';
const logo = '/images/landing-practice/ht-logo.webp';
const levels = [
    ['productA', 'Level 1 — Years 1–3'],
    ['productB', 'Level 2 — Years 4–6'],
    ['productC', 'Lower Secondary — Forms 1–3'],
    ['productD', 'Upper Secondary / SPM — Forms 4–5'],
];

function safeLink(text) {
    try {
        const url = new URL(text);
        if (!['https:', 'http:'].includes(url.protocol)) return null;
        if (['hometutor.com.my', 'www.hometutor.com.my'].includes(url.hostname)
            && (url.searchParams.get('page') || '').includes('products')) {
            const target = url.searchParams.get('target');
            return levels.some(([id]) => id === target) ? `/products?target=${target}` : '/products';
        }
        return url.origin === window.location.origin ? url.pathname + url.search + url.hash : url.href;
    } catch { return null; }
}

function Reply({ text, t }) {
    return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
        if (!/^https?:\/\//.test(part)) return <span key={index}>{part}</span>;
        const href = safeLink(part);
        if (!href) return <span key={index}>{part}</span>;
        const url = new URL(href, window.location.origin);
        const target = url.searchParams.get('target');
        const level = levels.find(([id]) => id === target);
        const label = level ? t(level[1]) : url.pathname === '/products' ? t('View all packages')
            : url.pathname === '/register' ? t('Create a parent account')
            : url.pathname === '/login' ? t('Log in to HomeTutor')
            : url.pathname === '/forgot-password' ? t('Recover your password')
            : url.pathname === '/faq' ? t('Account & payment help')
            : (url.searchParams.get('page') || '').includes('registration') ? t('Account activation')
            : url.hostname === 'wa.me' ? t('Contact HomeTutor on WhatsApp') : url.hostname;
        const content = <><span>{label}</span><span aria-hidden="true">↗</span></>;
        return href.startsWith('/')
            ? <Link preserveState key={index} className="ht-url-btn" href={href}>{content}</Link>
            : <a key={index} className="ht-url-btn" href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
    });
}

export default function HomeTutorChatbot() {
    const { locale, t } = useMarketingCopy();
    const reduced = useReducedMotion();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [owl, setOwl] = useState('idle');
    const [reaction, setReaction] = useState(0);
    const [position, setPosition] = useState(null);
    const panel = useRef(null), input = useRef(null), toggle = useRef(null), feed = useRef(null);
    const hovered = useRef(false), reacting = useRef(false), timer = useRef(null);
    const drag = useRef(null), inFlight = useRef(null), lastSend = useRef(0), busy = useRef(false);

    useEffect(() => () => { clearTimeout(timer.current); inFlight.current?.abort(); }, []);
    useEffect(() => { if (open) input.current?.focus(); }, [open]);
    useEffect(() => { if (feed.current) feed.current.scrollTop = feed.current.scrollHeight; }, [messages, sending, open]);
    useEffect(() => {
        const resized = () => setPosition(current => {
            if (!current || window.innerWidth < 640) return null;
            const box = panel.current?.getBoundingClientRect();
            return { x: Math.max(0, Math.min(current.x, innerWidth - (box?.width || 360))), y: Math.max(0, Math.min(current.y, innerHeight - (box?.height || 520))) };
        });
        window.addEventListener('resize', resized);
        return () => window.removeEventListener('resize', resized);
    }, []);
    useEffect(() => {
        const escape = event => { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); } };
        document.addEventListener('keydown', escape);
        return () => document.removeEventListener('keydown', escape);
    }, [open]);

    function reactOwl() {
        clearTimeout(timer.current); reacting.current = true; setOwl('click'); setReaction(n => n + 1);
        timer.current = setTimeout(() => { reacting.current = false; setOwl(hovered.current ? 'hover' : 'idle'); }, 960);
    }
    function close() { setOpen(false); toggle.current?.focus(); }
    function append(message) { setMessages(current => [...current, { ...message, id: `${Date.now()}-${Math.random()}` }]); }

    async function send(text = draft) {
        text = text.trim();
        if (!text || busy.current) return;
        if (Date.now() - lastSend.current < 1500) {
            append({ role: 'assistant', copy: 'Please wait a moment before sending another message.' }); return;
        }
        lastSend.current = Date.now();
        append({ role: 'user', text }); setDraft('');
        // Keep the original grade shortcuts for broad package/subject enquiries.
        // Specific prices or year/form questions go to the local reply engine.
        if (/^(?:\/(?:level|subjek)|(?:show|view|list|see|what|which|lihat|senarai|pilih|apa)?\s*(?:the\s+)?(?:levels?|subjects?|packages?|tahap|subjek|pakej))\s*\??$/i.test(text)) {
            append({ role: 'assistant', levels: true }); return;
        }
        const controller = new AbortController(); inFlight.current = controller;
        busy.current = true; setSending(true);
        try {
            const response = await axios.post('/api/marketing/chatbot', { message: text, locale }, { timeout: 100000, signal: controller.signal, headers: { Accept: 'application/json' } });
            if (typeof response.data.reply !== 'string' || !response.data.reply.trim()) throw new Error('Empty reply');
            append({ role: 'assistant', text: response.data.reply, retry: response.data.unavailable ? text : undefined });
        } catch (error) {
            if (axios.isCancel(error)) return;
            const status = error.response?.status;
            append({ role: 'assistant', copy: status === 429 ? 'Too many messages. Please wait a moment before trying again.'
                : status === 419 ? 'Your session expired. Refresh the page and try again.'
                : status === 422 ? 'Please enter a message between 1 and 2000 characters.'
                : 'Connection failed. Please try again.', retry: status === 419 || status === 422 ? undefined : text });
        } finally {
            busy.current = false; setSending(false); inFlight.current = null;
            if (panel.current && !panel.current.hidden) input.current?.focus();
        }
    }
    function startDrag(event) {
        if (event.pointerType === 'touch' || innerWidth < 640 || event.target.closest('button')) return;
        const box = panel.current.getBoundingClientRect();
        drag.current = { x: event.clientX - box.left, y: event.clientY - box.top };
        setPosition({ x: box.left, y: box.top }); event.currentTarget.setPointerCapture(event.pointerId);
    }
    function moveDrag(event) {
        if (!drag.current) return;
        const box = panel.current.getBoundingClientRect();
        setPosition({ x: Math.max(0, Math.min(event.clientX - drag.current.x, innerWidth - box.width)), y: Math.max(0, Math.min(event.clientY - drag.current.y, innerHeight - box.height)) });
    }
    const suffix = owl === 'click' ? `?r=${reaction}` : '';
    return <div id="ht-widget-wrapper" className="ht-marketing-bot" lang={locale}>
        <div ref={panel} id="ht-chat-box" className={open ? 'open' : ''} hidden={!open} role="dialog" aria-modal="false" aria-label={t('HomeTutor assistant')} style={position ? { position: 'fixed', left: position.x, top: position.y } : undefined}>
            <div className="ht-header is-draggable" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
                <img className="ht-header-logo" src={logo} alt="" width="36" height="36" />
                <div className="ht-header-info"><h3>HT Bot</h3><div className="ht-status"><span className="ht-status-dot" />{t('HomeTutor assistant')}</div></div>
                <span className="ht-drag-hint" aria-hidden="true">⠿</span>
                <button type="button" className="ht-close-btn" onClick={close} aria-label={t('Close chat')}>✕</button>
            </div>
            <div ref={feed} id="ht-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label={t('Chat messages')}>
                <div className="ht-msg ai"><div className="ht-avatar"><img src={logo} alt="" /></div><div className="ht-bubble">{t("Hi! 👋 I'm HT Bot, your HomeTutor assistant. Ask me about learning, registration, subscriptions or account access. How can I help?")}</div></div>
                {messages.map(message => <div key={message.id} className={`ht-msg ${message.role === 'user' ? 'user' : 'ai'}`}>
                    <div className="ht-avatar">{message.role === 'user' ? t('ME') : <img src={logo} alt="" />}</div>
                    <div className="ht-bubble">{message.levels ? <><strong>{t("Choose your child's level:")}</strong><div className="ht-pill-container">{levels.map(([target,label]) => <Link preserveState className="ht-pill" key={target} href={`/products?target=${target}`}>{t(label)}</Link>)}</div></>
                        : message.role === 'user' ? message.text : <Reply text={message.copy ? t(message.copy) : message.text} t={t} />}
                        {message.retry && <button type="button" className="ht-retry" disabled={sending} onClick={() => send(message.retry)}>{t('Try again')}</button>}
                    </div>
                </div>)}
                {sending && <div className="ht-msg ai" role="status"><div className="ht-avatar"><img src={logo} alt="" /></div><div className="ht-bubble ht-loading"><span /><span /><span /><span className="sr-only">{t('HT Bot is typing')}</span></div></div>}
            </div>
            <form className="ht-footer" onSubmit={event => { event.preventDefault(); send(); }}>
                <label className="sr-only" htmlFor="ht-user-input">{t('Your question')}</label>
                <input ref={input} type="text" id="ht-user-input" placeholder={t('Type your question...')} maxLength={2000} autoComplete="off" value={draft} onChange={event => setDraft(event.target.value)} />
                <button id="ht-send-btn" type="submit" disabled={sending || !draft.trim()} aria-label={t('Send message')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg></button>
            </form>
        </div>
        <button ref={toggle} id="ht-toggle-btn" type="button" onClick={() => { setOpen(current => !current); reactOwl(); }} aria-label={t(open ? 'Close chat' : 'Open HT Bot')} aria-controls="ht-chat-box" aria-expanded={open}
            onPointerEnter={() => { hovered.current = true; if (!reacting.current) setOwl('hover'); }} onPointerLeave={() => { hovered.current = false; if (!reacting.current) setOwl('idle'); }}
            onFocus={() => { if (!reacting.current) setOwl('hover'); }} onBlur={() => { if (!reacting.current && !hovered.current) setOwl('idle'); }}>
            {reduced ? <img className="ht-owl-mascot" src={artwork+'owl-poster.png'} alt="" width="320" height="320" /> : <picture><source type="image/webp" srcSet={`${artwork}owl-${owl}.webp${suffix}`} /><img className="ht-owl-mascot" src={`${artwork}owl-${owl}.gif${suffix}`} alt="" width="320" height="320" /></picture>}
        </button>
    </div>;
}
