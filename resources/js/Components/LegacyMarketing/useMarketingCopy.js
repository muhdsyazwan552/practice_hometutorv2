import { useLanguage } from '@/Contexts/LanguageContext';
import copy from './marketing-copy.json';

const normalize = text => text.replace(/\s+/g, ' ').trim();
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function translateMarketing(source, locale = 'en') {
    return copy[normalize(source)]?.[locale === 'ms' ? 'ms' : 'en'] ?? source;
}

// Translate trusted source text only; preserve links, SVGs, prices and markup.
export function localizeMarkup(markup, locale) {
    const text = markup.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, node) => {
        if (tag || !copy[normalize(node)]) return match;
        const leading = node.match(/^\s*/)[0];
        const trailing = node.match(/\s*$/)[0];
        return leading + escape(translateMarketing(node, locale)) + trailing;
    });
    return text.replace(/(alt|aria-label)="([^"]*)"/g, (match, attribute, value) => copy[normalize(value)] ? `${attribute}="${escape(translateMarketing(value, locale))}"` : match);
}

export default function useMarketingCopy() {
    const { locale } = useLanguage();
    return { locale, t: source => translateMarketing(source, locale), html: markup => localizeMarkup(markup, locale) };
}
